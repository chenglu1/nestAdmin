import React from 'react';
import { Prompts, Sender } from '@ant-design/x';
import { useChatBoxStyles } from '../styles';
import type { LocaleText } from '../config';
import { getSenderPrompts } from '../config';

interface ChatSenderProps {
  inputValue: string;
  isRequesting: boolean;
  onSubmit: () => void;
  onChange: (value: string) => void;
  onCancel: () => void;
  t: LocaleText;
  submitPrompt: (val: string) => void;
}

const ChatSender: React.FC<ChatSenderProps> = ({
  inputValue,
  isRequesting,
  onSubmit,
  onChange,
  onCancel,
  t,
  submitPrompt,
}) => {
  const { styles } = useChatBoxStyles();

  return (
    <div className={styles.chatSender}>
      {/* 🌟 提示词 */}
      <Prompts
        items={getSenderPrompts(t)}
        onItemClick={(info) => {
          submitPrompt(info.data.description as string);
        }}
        styles={{
          item: { padding: '6px 12px' },
        }}
        className={styles.senderPrompt}
      />
      {/* 🌟 输入框 */}
      <Sender
        value={inputValue}
        onSubmit={onSubmit}
        onChange={onChange}
        onCancel={onCancel}
        loading={isRequesting}
        className={styles.sender}
        placeholder={t.askMeAnything}
      />
    </div>
  );
};

export default ChatSender;
