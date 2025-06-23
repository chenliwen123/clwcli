import React from 'react';
import Style from './index.module.less'
import classNames from 'classnames';
const {{name}} = () => {
 
  return (
    <div className={classNames([Style.{{name}}])}>
     
    </div>
  );
};
{{name}}.displayName = '{{name}}';

export default {{name}};