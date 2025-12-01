import React from 'react';
import { Conversations } from '@ant-design/x';
import { message } from 'antd';
import dayjs from 'dayjs';
import { useChatBoxStyles } from '../styles';
import type { LocaleText } from '../config';
import UserMenu from '@/components/UserMenu/UserMenu';

interface SidebarProps {
  conversations: any[];
  activeConversationKey: string;
  setActiveConversationKey: (key: string) => void;
  addConversation: (conversation: { key: string; label: string; group: string }) => void;
  setConversations: (conversations: any[]) => void;
  messages: any[];
  t: LocaleText;
}

const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationKey,
  setActiveConversationKey,
  addConversation,
  setConversations,
  messages,
  t,
}) => {
  const { styles } = useChatBoxStyles();
  const [messageApi] = message.useMessage();

  return (
    <div className={styles.sider}>
      {/* 🌟 Logo */}
      <div className={styles.logo}>
        <img
          src="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*eco6RrQhxbMAAAAAAAAAAAAADgCCAQ/original"
          draggable={false}
          alt="logo"
          width={24}
          height={24}
        />
        <span>Ant Design X</span>
      </div>

      {/* 🌟 会话管理 */}
      <Conversations
        creation={{
          onClick: () => {
            if (messages.length === 0) {
              messageApi.error(t.nowNenConversation);
              return;
            }
            const now = dayjs().valueOf().toString();
            addConversation({
              key: now,
              label: `${t.newConversation} ${conversations.length + 1}`,
              group: t.today,
            });
            setActiveConversationKey(now);
          },
        }}
        items={conversations.map(({ key, label }) => ({
          key,
          label: key === activeConversationKey ? `[${t.curConversation}]${label}` : label,
        }))}
        className={styles.conversations}
        activeKey={activeConversationKey}
        onActiveChange={setActiveConversationKey}
        groupable
        styles={{ item: { padding: '0 8px' } }}
        menu={(conversation) => ({
          items: [
            {
              label: t.rename,
              key: 'rename',
            },
            {
              label: t.delete,
              key: 'delete',
              danger: true,
              onClick: () => {
                const newList = conversations.filter((item) => item.key !== conversation.key);
                const newKey = newList?.[0]?.key;
                setConversations(newList);
                if (conversation.key === activeConversationKey) {
                  setActiveConversationKey(newKey);
                }
              },
            },
          ],
        })}
      />

      {/* 用户信息区域 - 底部固定 */}
      <div className={styles.siderUserFooter}>
        <div style={{ margin: '8px 0' }} />
        <UserMenu />
      </div>
    </div>
  );
};

export default Sidebar;
