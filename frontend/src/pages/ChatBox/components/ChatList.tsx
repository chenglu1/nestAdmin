import React, { useRef, useEffect } from 'react';
import { Bubble, Prompts, Welcome } from '@ant-design/x';
import XMarkdown from '@ant-design/x-markdown';
import { Flex, Space, Button } from 'antd';
import { ShareAltOutlined, EllipsisOutlined } from '@ant-design/icons';
import { useChatBoxStyles } from '../styles';
import type { LocaleText } from '../config';
import { getHotTopics, getDesignGuide } from '../config';
import ThinkComponent from './ThinkComponent';

interface ChatContent {
  text?: string;
  ext_text?: string;
}

interface ChatMessage {
  content: ChatContent;
  role: string;
}

interface ChatItem {
  message: ChatMessage;
  status: 'error' | 'abort' | 'loading' | 'success' | 'local' | 'updating' | undefined;
  id: string | number;
}

interface ChatListProps {
  messages: ChatItem[];
  t: LocaleText;
  className: string;
  onSubmit: (val: string) => void;
}

const ChatList: React.FC<ChatListProps> = ({
  messages,
  t,
  className,
  onSubmit,
}) => {
  const { styles } = useChatBoxStyles();
  const chatListRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [messages]);

  const role = {
    assistant: {
      placement: 'start' as const,
      avatar: <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: '#1890ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12 }}>AI</div>,
      contentRender: (content: ChatContent, { status }: { status?: string }) => {
        const markdownText = `${content.ext_text ? '<think>\n\n' + content.ext_text + (content.text ? '\n\n</think>\n\n' : '') : ''}${content.text || ''}`;
        return (
          <XMarkdown
            content={markdownText as string}
            className={className}
            components={{
              think: (props) => <ThinkComponent {...props} t={t} />,
            }}
            streaming={{ hasNextChunk: status === 'updating', enableAnimation: true }}
          />
        );
      },
      streaming: (_: ChatContent, { status }: { status?: string }) => {
        return status === 'updating';
      },
      typing: {
        effect: 'typing' as const,
        interval: 50,
        keepPrefix: true,
      },
      variant: 'filled' as const,
      shape: 'round' as const,
    },
    user: {
      placement: 'end' as const,
      avatar: <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: '#52c41a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12 }}>U</div>,
      variant: 'filled' as const,
      shape: 'round' as const,
    },
  };

  return (
    <div className={styles.chatList} ref={chatListRef}>
      <div style={{ width: '100%', padding: '0 24px', boxSizing: 'border-box' }}>
        {messages?.length ? (
          /* 🌟 消息列表 */
          <Bubble.List
            items={messages?.slice().reverse().map((i) => ({
              ...i.message,
              status: i.status,
              loading: i.status === 'loading',
              key: i.id,
            }))}
            styles={{
              bubble: {
                maxWidth: '100%',
              }
            }}
            role={role}
          />
        ) : (
          <Flex
            vertical
            style={{
              maxWidth: '100%',
            }}
            gap={16}
            align="center"
            className={styles.placeholder}
          >
            <Welcome
              variant="borderless"
              icon="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*s5sNRo5LjfQAAAAAAAAAAAAADgCCAQ/fmt.webp"
              title={t.helloAntdXAgent}
              extra={
                <Space>
                  <Button icon={<ShareAltOutlined />} />
                  <Button icon={<EllipsisOutlined />} />
                </Space>
              }
            />
            <Flex gap={16}>
              <Prompts
                items={[getHotTopics(t)]}
                styles={{
                  list: { height: '100%' },
                  item: {
                    flex: 1,
                    backgroundImage: 'linear-gradient(123deg, #e5f4ff 0%, #efe7ff 100%)',
                    borderRadius: 12,
                    border: 'none',
                  },
                  subItem: { padding: 0, background: 'transparent' },
                }}
                onItemClick={(info) => {
                  onSubmit(info.data.description as string);
                }}
                className={styles.chatPrompt}
              />

              <Prompts
                items={[getDesignGuide(t)]}
                styles={{
                  item: {
                    flex: 1,
                    backgroundImage: 'linear-gradient(123deg, #e5f4ff 0%, #efe7ff 100%)',
                    borderRadius: 12,
                    border: 'none',
                  },
                  subItem: { background: '#ffffffa6' },
                }}
                onItemClick={(info) => {
                  onSubmit(info.data.description as string);
                }}
                className={styles.chatPrompt}
              />
            </Flex>
          </Flex>
        )}
      </div>
    </div>
  );
};

export default ChatList;
