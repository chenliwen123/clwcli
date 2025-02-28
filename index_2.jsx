import React from 'react';
import { DcpButton, DcpDrawer, DcpSpin, DcpSpace, Input, Tooltip, DcpTabs } from 'dcp-design-react';
import { Popconfirm } from 'antd';
import { InfoCircleFilled } from '@ant-design/icons';
import { Message, cloneDeep, destroyAlert } from '@/utils';
import DefineTable from './components/DefineTable';
import SettingBar from './components/SettingBar';
import { PUBLISH_TYPE, makePreviewConfig } from './utils';
import styles from './index.module.less';
import BaseConfig from './components/BaseConfig';
import TemplateDesign from './components/TemplateDesign';
import LeftFilterTree from '../components/LeftFilterTree';
import { DE0505_getAllDict } from '@main/utils';
// 获取字典项
import { getDic } from '@/modules/main/api/buc001';
import { //
  COMP_TYPE_INPUT,
  COMP_TYPE_SELECT,
  COMP_TYPE_UPLOAD,
  COMP_TYPE_TEXTAREA,
  COMP_TYPE_SEARCH,
  COMP_BUSINESS_ORG,
  COMP_BUSINESS_TAGS,
  COMP_BUSINESS_TAGS_VIEW,
  COMP_BUSINESS_LAND,
  COMP_BUSINESS_PART,
  COMP_BUSINESS_SOFT,
  COMP_TYPE_STEP,
  componentMap
} from '@/modules/main/pages/buc0012001/components/TemplateDesign/LeftComp/utils';
import {
  deleteTemplate,
  updateOrSaveTemplate,
  getTemplateById,
  publishTemplate,
} from '@/modules/main/api/buc00120';
import { queryFlowTree } from '@main/api/buc051new';
import { getNewUserInfo } from '@/utils/cookies';
import { INIT_FORM_LIST } from '@/modules/main/pages/buc00120/components/TemplateDesign/LeftComp/utils';
import GeneralBusinessForm from '../buc04105new/components/Edit/components/GeneralBusinessForm';
import classNames from 'classnames';
import Buc0012001 from './Context'
import css from './index.module.less'

// 业务单元模板
class Buc00120 extends React.Component {
  static displayName = 'Buc00120';

  state = {
    typeIndex: 0,
    projectTypeList: PUBLISH_TYPE,
    fetchParams: { processTypeParentId: '', processTypeId: '' },
    loading: false,
    visible: false,
    actions: {
      type: '',
      title: '',
      recordId: '',
    },
    createDisabled: true,
    selectedRows: [],
    tabitem: 0,
    baseFormData: {},
    tempFormData: {},
    dictList: [],
    treeData: [],
    selectedKeys: [],
    oldId: '',
    visibleView: false,
    previewList: [],
    staticList: [],
    list: [],
    backTempList: [],
    onSelectClick: {},
    isShowScreen: false,
    drawerWidth: 720,
    contextLevel:{},
    Selectrow:{},
    parentOpen:true,
    value:null,
  };
  dragFromList = React.createRef([]);
  curSelectedRow = null;
  treeFullData = [];


  componentDidMount() {
    this.getDictList();
    this.getTreeData();
  }

  // 获取树形数据
  getTreeData = async () => {
    const res = await queryFlowTree({
      userId: getNewUserInfo().id,
      type:'template_admin'
     });
    // const treeData = this.setTreeIndex(this.filterTreeData(res.data), null);
    const treeData = this.setTreeIndex(res.data || [], null);
    if (res.code === 200) {
      this.setState({ treeData });
      this.onSelect([treeData[0]?.id], {});
    }
  };
  filterTreeData = (data) => {
    return data.filter(item=>{
      item.children = item.children && item.children.length ? this.filterTreeData(item.children) : []
      if(['ALL'].includes(item?.templateConfig) || item.children.length > 0){ // 全景里面配置了权限的 或者 子节点有权限的
        return true;
      }
      return false;
    })
  }
   // 流程树的角标
   additionalView = node => {
    if (!['ALL'].includes(node?.templateConfig) || !['template_admin'].includes(node.businessChargeType)) return null
    return <Tooltip title='该流程节点可创建业务单元模板' placement="top"
      color="#000000bf" overlayClassName={css.tips}>
      <div className={css.subscript}>
      </div>
    </Tooltip>
  }
  // 设置 treeIndex
  setTreeIndex = (data, level) => {
    return data.map((item, index) => {
      this.treeFullData.push(item);
      const treeIndex = level ? level + '.' + (index + 1) : index + 1;
      return {
        ...item,
        title: treeIndex + ' ' + item.name,
        treeIndex,
        children:
          item.children && item.children.length ? this.setTreeIndex(item.children, treeIndex) : [],
      };
    });
  };

  // 点击回调
  onSelect = async (keys, e) => {
    if(keys.length <= 0) return;
    const level = e.node?.level;
    const id = keys?.length > 0 ? keys[0] : '';
    const row = this.treeFullData.find(treritem => treritem.id === id);
    const dicts = await DE0505_getAllDict();
    const mainRoleName = (dicts['main_role_name'] || []).find(dic => dic.code === row?.mainRoleName)?.text
    const subRoleName = (dicts['sub_role_name'] || []).find(dic => dic.code === row?.subRoleName)?.text
    const treeId =
      level == '1' || level == '2'
        ? { processTypeParentId: '', processTypeId: id, treeId: row?.treeId }
        : { processTypeParentId: id, processTypeId: '', treeId: row?.treeId };
    this.setState({
      selectedKeys: keys,
      fetchParams: Object.assign({}, { ...this.state.fetchParams,searchValue:'',searchStatus:''}, treeId),
      onSelectClick: { keys, e },
      contextLevel:{
        level1:mainRoleName || '角色',
        level2:subRoleName || '子角色',
        isEdit:row?.templateConfig === 'ALL' && row.businessChargeType === 'template_admin'
      },
      Selectrow:row,
      typeIndex:0,
      value:null,
    });
    this.curSelectedRow = e.selected ? e.node : null;
  };

  // 获取接口字典
  getDictList = async () => {
    const res = await getDic({ name: 'business_template_field' });
    if (res.code === 200) {
      let dictList = res.data?.map((item) => ({
        ...item,
        text: item.discription,
        value: item.code,
      }));
      this.setState({ dictList });
    }
  };

  // 执行表格查询
  fetchHandle = async (params) => {
    this.setState((prev) => ({ fetchParams: Object.assign({}, prev.fetchParams, params) }));
  };

  // 去除数组对象中同一类型数据
  removeRepeat = (arr) => {
    const { dictList, contextLevel } = this.state;
    arr = arr.filter( (item, index, arr) => {
      if ([COMP_BUSINESS_LAND, COMP_BUSINESS_TAGS, COMP_BUSINESS_TAGS_VIEW, COMP_BUSINESS_PART].includes(item.type)) {
        const flag = arr.findIndex((t) => t.type === item.type) === index;
        if(flag && componentMap[item.type]?.fetch?.api){
          componentMap[item.type]?.fetch?.afterFetch?.(item,dictList, { contextLevel })
        }
        return flag;
      } else {
        return item;
      }
    });
    return arr;
  };

  // 新增、编辑、预览、复制、删除 方法
  clickHandle = async (type, recordId, count) => {
    if (type === 'delete') {
      this.handleDelete(recordId);
    } else {
      const { list, selectedKeys } = this.state;
      // 未发布版本禁止创建
      // if (type === 'add' && !this.state.fetchParams.processTypeId) {
      //   this.setState({ baseFormData: {} });
      //   // 新增模板 并且没有选择二级流程目录则禁止创建
      //   return false;
      // } else
     if (
        // this.state.fetchParams.processTypeId &&
        type === 'add' &&
        list?.filter(item => item.processType === selectedKeys?.[0])?.map((item) => item.templateStatus).includes('10')
      ) {
        this.setState({ baseFormData: {} });
        return Message('存在未发布模板', 'warning');
      } else {
        if (['show', 'edit', 'version', 'update', 'view'].includes(type)) {
          const detailForm = await getTemplateById({ id: recordId.id });
          const userMap = detailForm.data.submitUserMap;
          this.setState({
            baseFormData: {
              templateName: detailForm.data.templateName,
              templateDescription: detailForm.data.templateDescription,
              approvalInfo: JSON.parse(detailForm.data.approvalInfo || '[]'),
              submitType: detailForm.data.submitType,
              userInfoList: userMap ? Object.values(userMap) : [],
              templateVersion: detailForm.data?.templateVersion,
              treeId: detailForm.data?.treeId,
              processType: detailForm.data?.processType,
            },
          });
          if (type !== 'show' && type !== 'version' && type !== 'view' && type !== 'edit') {
            this.setState({
              fetchParams: {
                ...this.state.fetchParams,
                processTypeId: detailForm.data?.processType,
              },
            });
          }
          const templateDetail = this.removeRepeat(
            JSON.parse(detailForm.data.templateDetail || '[]')
          );
          this.dragFromList.current = templateDetail;
          this.setState({
            backTempList: templateDetail,
          });
          this.makePreviewData(cloneDeep(templateDetail), type);
        }
        const conf = { add: '新增', edit: '修订', update: '编辑', view: '查看', version: '查看' };
        this.setState({
          actions: Object.assign({}, { title: conf[type], recordId, type }),
          visible: type !== 'view' && type !== 'version',
          oldId: recordId?.id,
          tabitem: type === 'version' ? 2 : 0,
          // 新增去除之前的缓存
          baseFormData: Object.assign({}, this.state.baseFormData),
        });
        this.handleSwitchChange(count !== null ? count : this.state.tabitem);
      }
    }
  };

  // 构造预览数据
  makePreviewData = (data = [], type = '') => {
    if (!Array.isArray(data)) {
      return Message('当前数据暂无模板配置', 'warning');
    }
    const makeList = makePreviewConfig(data || []);
    const previewList = makeList.map((ll) => ll.detail) || [];
    if (type === 'view' || type === 'version') {
      this.setState({ visibleView: true, previewList });
    }
  };

  // 删除
  handleDelete = async (id) => {
    const res = await deleteTemplate({ id });
    if (res.code === 200) {
      Message('删除成功', 'success');
      this.fetchHandle();
    }
  };

  // 表单数据变更，关闭抽屉时的提示
  doCloseHandle = async () => {
    this.setState({
      visible: false,
      visibleView: false,
      baseFormData: Object.assign({}),
      // dragFromList: [],
    });
    this.dragFromList.current = []
    // 版本进入查看,关闭再返回版本
    if (this.state.actions.type === 'version') {
      this.handleSwitchChange(2);
      this.defineTableRef.settingVisible(true);
    }
  };

  // 处理搜索事件，
  handleSearch = async (value) => {
    const { fetchParams } = this.state;
    const newParm = Object.assign({}, fetchParams, { ...fetchParams, searchValue: value?.trim() });
    this.setState({ fetchParams: newParm });
  };

  // 发布
  handlePublishClick = async (type = '') => {
    let ids = [];
    if (type === 'check') {
      const res = await this.handleSaveFormClick('publish');
      if (!res) return;
      ids = [res];
    } else {
      const { selectedRows } = this.state;
      if (selectedRows.length < 1) {
        return Message('请选择未发布数据', 'warning');
      }
      if (selectedRows.map((item) => item.templateStatus).includes('20')) {
        return Message('请选择未发布数据', 'warning');
      }
      ids = selectedRows.map((item) => item.id);
    }
    const res = await publishTemplate({ ids });
    if (res.code === 200) {
      // 清空选中项
      this.defineTableRef.tableRef?.SET_SELECTION([]);
      Message(res.message || '发布成功', 'success');
      this.setState({ visible: false });
      // this.fetchHandle();
      this.handleSwitchFullViewTree();
    }
  };

  // 基础配置组件表单校验
  validBasicForm = (form) => {
    // 审批场景
    const hasChecked = form.approvalInfo.filter((al) => al.checked);
    if (hasChecked.length && !form.submitType) {
      Message('请选择审批人', 'warning');
      return false;
    }
    // 审批人
    if (form.submitType === '03' && form.userInfoList.length < 1) {
      Message('请选择人员', 'warning');
      return false;
    }
    return true;
  };
  // 保存
  handleSaveFormClick = async (type = '') => {
    const { baseFormData, tempFormData, actions, oldId, fetchParams, Selectrow } = this.state;
    // 基础配置
    const baseInfo = await this.baseConfigRef?.getAllFormInfoData();
    // if (!baseInfo) return false;
    const finalConfigBaseForm = Object.assign(
      {},
      baseFormData,
      !baseInfo ? baseFormData : baseInfo
    );
    if (!this.baseConfigRef && !this.validBasicForm(finalConfigBaseForm)) return;
    this.setState({ baseFormData: finalConfigBaseForm });
    // 审批场景 全选必填提交人
    if (
      finalConfigBaseForm.approvalInfo?.some((item) => item.checked) &&
      finalConfigBaseForm.submitType === ''
    ) {
      return false;
    }
    // 提交人 指定人员 必选
    if (finalConfigBaseForm.submitType === '03' && finalConfigBaseForm.userInfoList.length < 1) {
      return false;
    }
    // 模板设计
    const finalConfigTempForm = Object.assign({}, tempFormData);
    this.setState({ tempFormData: finalConfigTempForm });
    // const basicInfo = await this.tdRef?.basicInfo;
    let collectEmpty = [];
    this.dragFromList.current = this.dragFromList.current?.length
      ? this.dragFromList.current
      : this.state.backTempList?.length
      ? this.state.backTempList
      : INIT_FORM_LIST;
    this.dragFromList.current?.forEach((tdc) => {
      if (
        [COMP_TYPE_INPUT, COMP_TYPE_SELECT, COMP_TYPE_UPLOAD, COMP_TYPE_SEARCH, COMP_TYPE_STEP].includes(tdc.type)
      ) {
        if (!tdc.properties.formField || !tdc.properties.label) {
          collectEmpty.push(false);
        }
        if (tdc.properties.formField === 'workingHours' && !tdc.properties.unit) {
          collectEmpty.push(false);
        }
      }
      if (tdc.type === COMP_TYPE_TEXTAREA) {
        if (!tdc.properties.label) {
          collectEmpty.push(false);
        }
      }
      if ([COMP_BUSINESS_ORG].includes(tdc.type)) {
        if (!tdc.properties.value) {
          collectEmpty.push(false);
        }
      }
      if ([COMP_BUSINESS_PART, COMP_BUSINESS_SOFT, COMP_BUSINESS_ORG].includes(tdc.type)) {
        if (!tdc.properties.fieldName) {
          collectEmpty.push(false);
        }
      }
      // 205 209 210
      // 210 有默认 属性 这个勾选,不拦截 COMP_BUSINESS_TAGS_VIEW
      if ([COMP_BUSINESS_TAGS, COMP_BUSINESS_LAND, COMP_BUSINESS_TAGS_VIEW].includes(tdc.type)) {
        if (!tdc.properties?.value || tdc.properties?.value?.map((ll) => ll)?.length < 1) {
          collectEmpty.push(false);
        }
      }
    });
    if (!finalConfigBaseForm.templateName && !baseFormData.templateName) {
      collectEmpty.push(false);
    }
    if (collectEmpty.includes(false)) {
      destroyAlert();
      Message('请检查表单项必填项配置', 'warning');
      collectEmpty.length = 0;
      return;
    }

    const templateList = this.dragFromList.current?.length
      ? this.dragFromList.current
      : INIT_FORM_LIST;
    const updateOrSaveParams = {
      approvalInfo: JSON.stringify(finalConfigBaseForm.approvalInfo),
      submitType: finalConfigBaseForm.submitType || baseFormData.submitType,
      templateDescription: finalConfigBaseForm.templateDescription,
      templateName: finalConfigBaseForm.templateName,
      // submitUserId: baseInfo.userInfoList?.map((item) => item.id)?.join(','), // 自定义审批人 id
      templateDetail: JSON.stringify(makePreviewConfig(templateList || [])), // templateList,
      processType: baseInfo?.processType || (fetchParams.processTypeId ? fetchParams.processTypeId : fetchParams.processTypeParentId),
      currentUserName: getNewUserInfo().name,
      templateVersion: baseFormData?.templateVersion,
    };
    // update 表示编辑  edit 修订
    if (actions.type === 'update') {
      updateOrSaveParams['id'] = oldId;
      updateOrSaveParams['oldId'] = '';
    } else {
      updateOrSaveParams['oldId'] = actions.type !== 'add' ? oldId : '';
      updateOrSaveParams['id'] = '';
    }
    if (updateOrSaveParams.submitType === '03') {
      updateOrSaveParams['submitUserId'] = baseInfo?.userInfoList
        ?.map((item) => item.id)
        ?.join(','); // 自定义审批人 id
    } else {
      updateOrSaveParams['submitUserId'] = '';
    }
    updateOrSaveParams.treeId = baseInfo?.treeId || Selectrow.treeId;

    console.log('业务单元模版',templateList);
    const result = await updateOrSaveTemplate(updateOrSaveParams);
    if (result.code === 200) {
      this.setState({ baseFormData: {} });
      if (type === 'publish') {
        return result.data;
      } else {
        Message('保存成功', 'success');
        this.setState({ visible: false });
        // this.fetchHandle();
        this.handleSwitchFullViewTree();
      }
    }
  };

  // 切换 tab
  handleSwitchChange = async (tabitem) => {
    const { baseFormData, tempFormData } = this.state;
    this.setState({ tabitem });
    if (tabitem === 0) {
      this.baseConfigRef?.init(baseFormData);
    }
    if (tabitem === 1) {
      this.tdRef?.init && this.tdRef?.init(tempFormData);
    }
    if (tabitem === 2) {
      const basicInfo = await this.tdRef?.basicInfo;
      const dragFromList = basicInfo?.length
        ?  basicInfo
        : this.dragFromList.current;
      // 处理业务标签 205 209 210 回显重复的问题
      const tempList = makePreviewConfig(dragFromList || [], '');
      const staticList = tempList.map((item) => item.detail);
      this.setState({ staticList: [...staticList] });
    }
    if (tabitem === -1) {
      this.setState({ visible: false, baseFormData: Object.assign({}) });
      this.handleSwitchFullViewTree();
    }
  };

  // 跳转全景树
  handleSwitchFullViewTree = () => {
    if (this.state.onSelectClick?.keys) {
      this.onSelect(this.state.onSelectClick?.keys, this.state.onSelectClick?.e);
    } else {
      this.onSelect('', '');
    }
  };

  // 模板固定表单数据
  getTempFromData = (formData) => {
    this.setState({ tempFormData: formData });
  };

  // 拖拽数据
  getDragList = (data) => {
    this.dragFromList.current = !data ? this.dragFromList.current : data;
  };

  // 表单数据
  getBaseConfigData = (formData) => {
    this.setState({ baseFormData: formData });
  };

  SetparentOpen = (parentOpen) => {
    this.setState({
      parentOpen
    })
  }

  render() {
    const {
      projectTypeList,
      fetchParams,
      loading,
      visible,
      typeIndex,
      createDisabled,
      tabitem,
      baseFormData,
      tempFormData,
      dictList,
      treeData,
      selectedKeys,
      actions,
      visibleView,
      previewList,
      staticList,
      isShowScreen,
      drawerWidth,
      contextLevel,
      Selectrow,
      parentOpen,
      value,
    } = this.state;
    return (
      <div className={styles.buc120_wrapper_all}>
        <Buc0012001.Provider value={contextLevel}>
          <DcpSpin spinning={loading}>
            <div className={styles.buc120_wrapper}>
              {treeData.reduce((s,e)=>(s+=e?.children?.length||0),0) > 0?<LeftFilterTree
                treeData={treeData}
                selectedKeys={selectedKeys}
                onSelect={this.onSelect}
                additionalView={this.additionalView}
                SetparentOpen={this.SetparentOpen}
              />:<></>}
              <div className={styles.right}>
                {/* 操作栏 */}
                <div className={styles.header}>
                  {
                    treeData.reduce((s,e)=>(s+=e?.children?.length||0),0) <=0?<DcpTabs
                      items={treeData.map((item) => ({
                        label: item.name,
                        key:item.id
                      }))}
                      tabBarGutter={0}
                      activeKey={selectedKeys[0]}
                      onChange={e=>(this.onSelect([e], {selected: true, node: treeData.find(item=>item.id===e?.[0])}))}
                    ></DcpTabs>:<></>
                  }
                  <div className={styles.program_type}>
                    {/* tab 切换 */}
                    <div className={classNames(styles.program_type_left,{[styles.program_type_left_ml]:!parentOpen})}>
                      {
                        <div className={styles.program_type_tabs}>
                          <ul>
                            {projectTypeList.map((item, index) => {
                              return (
                                <li
                                  key={index}
                                  onClick={(e) => {
                                    this.setState({
                                      typeIndex: index,
                                      fetchParams: {
                                        ...fetchParams,
                                        searchStatus: index === 0 ? '' : index === 1 ? '10' : '20',
                                      },
                                    });
                                  }}
                                  className={index === typeIndex ? styles.selected_tab : ''}
                                >
                                  {item.text}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      }
                    </div>
                    {/* 筛选与操作按钮 */}
                    <div className={styles.program_type_right}>
                      <DcpSpace>
                        <Input
                          placeholder="请输入模板名称"
                          className={styles.search}
                          suffix={
                            <i
                              className={`iconfont icon-xiaosu2 ${styles.search_icon}`}
                              onClick={() => this.handleSearch(value)}
                              style={{ fontSize: '14px', color: '#97A0C3' }}
                            ></i>
                          }
                          value={value}
                          onChange={(e) => {
                            this.setState({ value: e.target.value });
                          }}
                          onPressEnter={() => this.handleSearch(value)}
                          ref={(input) => (this.input = input)}
                        />
                        {
                          contextLevel.isEdit?<>
                            <Popconfirm
                            overlayClassName={classNames(styles.warning, styles.btn_popover)}
                            title="确定要发布已选中的业务单元模板吗？"
                            okText="确定"
                            cancelText="取消"
                            placement="topRight"
                            icon={<InfoCircleFilled style={{ color: '#0052D9' }} />}
                            onConfirm={this.handlePublishClick}
                          >
                            <DcpButton className={styles.publish} type="primary">
                              发布
                            </DcpButton>
                          </Popconfirm>
                            {createDisabled ? (
                              <Popconfirm
                                overlayClassName={styles.warning}
                                title="该流程下存在未发布业务单元模板"
                                okText="查看详情"
                                cancelText="取消"
                                placement="topRight"
                                icon={<InfoCircleFilled style={{ color: '#FAAD14' }} />}
                                onConfirm={() => this.clickHandle('add', null, 0)}
                              >
                                <DcpButton
                                  style={{ background: '#1A4BC5', borderRadius: '6px', border: 'none' }}
                                  type="primary"
                                >
                                  创建模板
                                </DcpButton>
                              </Popconfirm>
                            ) : (
                              <DcpButton
                                style={{ background: '#1A4BC5', borderRadius: '6px', border: 'none' }}
                                type="primary"
                                onClick={() => this.clickHandle('add', null, 0)}
                              >
                                创建模板
                              </DcpButton>
                            )}
                          </>:<></>
                        }

                      </DcpSpace>
                    </div>
                  </div>
                </div>
                {/* 表格数据 */}
                <div className={styles.content}>
                  <DefineTable
                    ref={(ref) => (this.defineTableRef = ref)}
                    projectTypeList={projectTypeList.filter((item, index) => index !== 0)}
                    clickHandle={this.clickHandle}
                    fetchParams={fetchParams}
                    getAllStatus={(status, list) => this.setState({ createDisabled: status, list })}
                    getSelectedRows={(selectedRows) => this.setState({ selectedRows })}
                    contextLevel={contextLevel}
                  />
                </div>
              </div>
            </div>
          </DcpSpin>
          <DcpDrawer
            ref={(ref) => (this.drawerRef = ref)}
            visible={visible}
            headerStyle={{ flex: '0 1 auto' }}
            title={
              <SettingBar
                style={'table'}
                handleSwitchChange={(tabitem) => this.handleSwitchChange(tabitem)}
                tabitem={tabitem}
              />
            }
            width={'100%'}
            getContainer={false}
            className={classNames(styles.dcp_drawer, styles.drawer)}
            bodyStyle={{ padding: 0, background: '#F4F5F6' }}
            onClosed={() => this.doCloseHandle()}
            closable={false}
            mask={false}
            extra={
              <DcpSpace>
                {actions.type !== 'version' ? (
                  <>
                    <DcpButton className={styles.save} onClick={this.handleSaveFormClick}>
                      保存
                    </DcpButton>
                    <DcpButton
                      type="primary"
                      onClick={() => this.handlePublishClick('check')}
                      className={styles.pub}
                    >
                      发布
                    </DcpButton>
                  </>
                ) : null}
              </DcpSpace>
            }
            showFullScreen={false}
          >
            {/* {tabitem === 0 ? ( */}
              <BaseConfig
                ref={(ref) => (this.baseConfigRef = ref)}
                actions={actions}
                formData={baseFormData}
                visible={tabitem === 0}
                getBaseConfigData={(formData) => this.getBaseConfigData(formData)}
              />
            {/* ) : null} */}
            {tabitem === 1 ? (
              <TemplateDesign
                ref={(ref) => (this.tdRef = ref)}
                tempFormData={tempFormData}
                dictList={dictList}
                actions={actions}
                // dragFromList={actions.type !== 'add' ? this.dragFromList.current : []}
                dragFromList={this.dragFromList.current}
                getTempFromData={(formData) => this.getTempFromData(formData)}
                getDragList={(data) => this.getDragList(data)}
              />
            ) : null}
            {tabitem === 2 && (
              <div style={{ padding: '12px', background: '#fff' }}>
                {staticList.length ? (
                  <GeneralBusinessForm
                    editType="show"
                    // key={createUidKey()}
                    template={staticList}
                    basicParam={{ templateId: '', businessId: '', menuId: '',treeRowData:Selectrow }}
                    onLoadingChange={() => null}
                  />
                ) : null}
              </div>
            )}
          </DcpDrawer>
          <DcpDrawer
            visible={visibleView}
            title={
              <span style={{ cursor: 'pointer' }} onClick={() => this.doCloseHandle()}>
                <i style={{ marginRight: 4 }} className="icon iconfont icon-zuofangxiang"></i>
                预览
              </span>
            }
            width={drawerWidth}
            getContainer={false}
            className={classNames(styles.dcp_drawer_view, styles.drawer)}
            bodyStyle={{ padding: '12px', background: '#fff' }}
            onClose={() => this.doCloseHandle()}
            showFullScreen={false}
            closable={false}
            extra={
              // <span style={{ color: '#EAEDF7' }}>|</span>
              isShowScreen ? (
                <span
                  className="iconfont icon-quanpingshouqi-1"
                  style={{ marginLeft: 16, cursor: 'pointer', color: '#000' }}
                  onClick={() => {
                    this.setState({ isShowScreen: false, drawerWidth: 720 });
                  }}
                ></span>
              ) : (
                <span
                  className="iconfont icon-quanping-1"
                  style={{ marginLeft: 16, cursor: 'pointer', color: '#000' }}
                  onClick={() => {
                    this.setState({ isShowScreen: true, drawerWidth: '100%' });
                  }}
                ></span>
              )
            }
          >
            {previewList ? (
              <GeneralBusinessForm
                editType="show"
                // key={createUidKey()}
                template={previewList}
                basicParam={{ templateId: '', businessId: '', menuId: '',treeRowData:Selectrow }}
                onLoadingChange={(loading) => this.setState({ loading })}
              />
            ) : (
              '无数据'
            )}
          </DcpDrawer>
        </Buc0012001.Provider>
      </div>
    );
  }
}

export default Buc00120;
