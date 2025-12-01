import { XProvider } from '@ant-design/x';
import enUS_X from '@ant-design/x/locale/en_US';
import zhCN_X from '@ant-design/x/locale/zh_CN';
import { useXChat, useXConversations } from '@ant-design/x-sdk';
import { message } from 'antd';
import React, { createContext, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMarkdownTheme } from '@/utils/markdown';
import { providerFactory } from '@/api/chat';
import { useChatBoxStyles } from './styles';
import { zhCN, enUS, getDefaultConversations } from './config';
import Sidebar from './components/Sidebar';
import ChatList from './components/ChatList';
import ChatSender from './components/ChatSender';

// ==================== Context ====================
interface ChatContextType {
  onReload?: ReturnType<typeof useXChat>['onReload'];
}

const ChatContext = createContext<ChatContextType>({});

const ChatBox: React.FC = () => {
  // ==================== Localization ====================
  const isZhCN = window.parent?.location?.pathname?.includes('-cn') || true;
  const t = isZhCN ? zhCN : enUS;
  const locale = isZhCN ? { ...zhCN_X } : { ...enUS_X };
  
  // ==================== Styles and Utils ====================
  const { styles } = useChatBoxStyles();
  const [className] = useMarkdownTheme();
  
  // ==================== URL Params ====================
  const [searchParams] = useSearchParams();
  const model = searchParams.get('model') || 'gpt-3.5-turbo'; // 默认使用gpt-3.5-turbo
  
  // ==================== State ====================
  const defaultConversations = getDefaultConversations(t);
  
  const {
    conversations,
    activeConversationKey,
    setActiveConversationKey,
    addConversation,
    setConversations,
  } = useXConversations({
    defaultConversations,
    defaultActiveConversationKey: defaultConversations[0].key,
  });

  const [, contextHolder] = message.useMessage();
  const [inputValue, setInputValue] = useState('');

  // ==================== Runtime ====================
  const { onRequest, messages, isRequesting, abort, onReload } = useXChat({
    provider: providerFactory(activeConversationKey, model), // 将模型参数传递给providerFactory
    conversationKey: activeConversationKey,
    requestPlaceholder: () => {
      return {
        content: { text: t.noData },
        role: 'assistant',
      };
    },
  });

  // ==================== Event ====================
  const onSubmit = (val: string) => {
    if (!val) return;

    onRequest({
      message: { role: 'user', content: val },
    });
  };

  const handleSubmit = () => {
    onSubmit(inputValue);
    setInputValue('');
  };

  // ==================== Render ====================
  return (
    <XProvider locale={locale}>
      <ChatContext.Provider value={{ onReload }}>
        {contextHolder}
        <div className={styles.layout}>
          <Sidebar
            conversations={conversations}
            activeConversationKey={activeConversationKey}
            setActiveConversationKey={setActiveConversationKey}
            addConversation={addConversation}
            setConversations={setConversations}
            messages={messages}
            t={t}
          />
          <div className={styles.chat}>
            <ChatList
              messages={messages}
              t={t}
              className={className}
              onSubmit={onSubmit}
            />
            <ChatSender
              inputValue={inputValue}
              isRequesting={isRequesting}
              onSubmit={handleSubmit}
              onChange={setInputValue}
              onCancel={abort}
              t={t}
              submitPrompt={onSubmit}
            />
          </div>
        </div>
      </ChatContext.Provider>
    </XProvider>
  );
};

export default ChatBox;