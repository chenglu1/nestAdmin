import React from 'react';
import { Think } from '@ant-design/x';

interface ThinkComponentProps {
  children?: React.ReactNode;
  streamStatus?: string;
  t: {
    DeepThinking: string;
    CompleteThinking: string;
  };
}

const ThinkComponent: React.FC<ThinkComponentProps> = (props) => {
  const { children, streamStatus, t } = props;
  const title = streamStatus === 'done' ? t.CompleteThinking : `${t.DeepThinking}...`;
  const loading = streamStatus !== 'done';

  return (
    <Think title={title} loading={loading}>
      {children}
    </Think>
  );
};

export default React.memo(ThinkComponent);
