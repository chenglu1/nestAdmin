import React, { useRef, useEffect, useState } from 'react';
import { Bubble, Prompts, Welcome } from '@ant-design/x';
import XMarkdown from '@ant-design/x-markdown';
import { Flex, Space, Button, message } from 'antd';
import { ShareAltOutlined, EllipsisOutlined, EditOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
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
  const [editingMessageId, setEditingMessageId] = useState<string | number | null>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [messages]);

  // 处理消息编辑
  const handleEditConfirm = (_content: string, _messageId: string | number) => {
    message.success('消息已更新');
    setEditingMessageId(null);
    // 这里可以添加更新消息的逻辑
  };

  // 处理消息复制
  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      message.success('已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  // 处理消息重试
  const handleRetry = (_messageId: string | number) => {
    message.info('正在重试...');
    // 这里可以添加重试逻辑
  };

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
        // 步进单位设置为随机区间，让打字效果更自然
        step: [1, 5] as [number, number],
        // 调整间隔为更符合人类打字速度的范围
        interval: 30,
        // 保留公共前缀，优化流式传输效果
        keepPrefix: true,
      },
      // 添加AI消息的footer，包含复制和重试按钮
      footer: (content: ChatContent, info: any) => {
        return (
          <Space size="small" style={{ marginTop: 8 }}>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopy(content.text || '')}
            >
              复制
            </Button>
            {(info.status === 'error' || info.status === 'abort') && (
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => handleRetry(info.key)}
              >
                重试
              </Button>
            )}
          </Space>
        );
      },
      variant: 'filled' as const,
      shape: 'round' as const,
    },
    user: {
      placement: 'end' as const,
      avatar: <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: '#52c41a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12 }}>U</div>,
      // 添加用户消息的footer，包含编辑按钮
      footer: (content: ChatContent, info: any) => {
        return (
          <Space size="small" style={{ marginTop: 8 }}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => setEditingMessageId(info.key)}
            >
              编辑
            </Button>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopy(content.text || '')}
            >
              复制
            </Button>
          </Space>
        );
      },
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
            items={messages?.map((i) => ({
              ...i.message,
              status: i.status,
              loading: i.status === 'loading',
              key: i.id,
              // 为用户消息添加编辑功能
              editable: i.message.role === 'user' ? {
                editing: editingMessageId === i.id,
              } : undefined,
              // 编辑确认和取消回调应该是BubbleItem的直接属性，而不是editable对象的属性
              onEditConfirm: (content: string) => handleEditConfirm(content, i.id),
              onEditCancel: () => setEditingMessageId(null),
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
