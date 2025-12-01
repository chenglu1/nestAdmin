import React from 'react';
import { Actions } from '@ant-design/x';
import { message, Pagination } from 'antd';

interface FooterProps {
  id?: number | string;
  content: string;
  status?: string;
  onReload?: (id: number | string, options: { userAction: string }) => void;
  t: {
    isMock: string;
    retry: string;
  };
}

const Footer: React.FC<FooterProps> = ({ id, content, status, onReload, t }) => {
  const Items = [
    {
      key: 'pagination',
      actionRender: <Pagination simple total={1} pageSize={1} />,
    },
    {
      key: 'retry',
      label: t.retry,
      onClick: () => {
        if (id && onReload) {
          onReload(id, {
            userAction: 'retry',
          });
        }
      },
    },
    {
      key: 'copy',
      actionRender: <Actions.Copy text={content} />,
    },
    {
      key: 'audio',
      actionRender: (
        <Actions.Audio
          onClick={() => {
            message.info(t.isMock);
          }}
        />
      ),
    },
  ];

  return status !== 'updating' && status !== 'loading' ? (
    <div style={{ display: 'flex' }}>{id && <Actions items={Items} />}</div>
  ) : null;
};

export default Footer;
