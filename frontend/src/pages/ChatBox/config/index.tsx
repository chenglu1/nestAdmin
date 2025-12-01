import { QuestionCircleOutlined } from '@ant-design/icons';

// ==================== 国际化配置 ====================
export interface LocaleText {
  whatIsAntdX: string;
  howToInstall: string;
  newAGIHybridUI: string;
  today: string;
  yesterday: string;
  hotTopics: string;
  designGuide: string;
  intent: string;
  role: string;
  conversation: string;
  hybridUI: string;
  aiUnderstandsUserNeeds: string;
  aiPublicImage: string;
  naturalConversation: string;
  guiWithNaturalConversation: string;
  newConversation: string;
  rename: string;
  delete: string;
  requestInProgress: string;
  demoButtonNoFunction: string;
  helloAntdXAgent: string;
  antdXDescription: string;
  askMeAnything: string;
  DeepThinking: string;
  CompleteThinking: string;
  noData: string;
  modelIsRunning: string;
  modelExecutionCompleted: string;
  executionFailed: string;
  aborted: string;
  curConversation: string;
  nowNenConversation: string;
  retry: string;
  isMock: string;
}

export const zhCN: LocaleText = {
  whatIsAntdX: '什么是 Ant Design X？',
  howToInstall: '如何快速安装和导入组件？',
  newAGIHybridUI: '新的 AGI 混合界面',
  today: '今天',
  yesterday: '昨天',
  hotTopics: '热门话题',
  designGuide: '设计指南',
  intent: '意图',
  role: '角色',
  conversation: '会话',
  hybridUI: '混合界面',
  aiUnderstandsUserNeeds: 'AI 理解用户需求并提供解决方案',
  aiPublicImage: 'AI 的公众形象',
  naturalConversation: '自然流畅的对话体验',
  guiWithNaturalConversation: 'GUI 与自然会话的完美融合',
  newConversation: '新会话',
  rename: '重命名',
  delete: '删除',
  requestInProgress: '请求正在进行中，请等待请求完成。',
  demoButtonNoFunction: '演示按钮，无实际功能',
  helloAntdXAgent: '你好，我是 Ant Design X 智能体',
  antdXDescription: '基于 Ant Design 的 AGI 产品界面解决方案，打造更卓越的智能视觉体验，助力产品设计与开发。',
  askMeAnything: '请输入您的问题...',
  DeepThinking: '深度思考中',
  CompleteThinking: '深度思考完成',
  noData: '暂无数据',
  modelIsRunning: '正在调用模型',
  modelExecutionCompleted: '大模型执行完成',
  executionFailed: '执行失败',
  aborted: '已经终止',
  curConversation: '当前对话',
  nowNenConversation: '当前已经是新会话',
  retry: '重新生成',
  isMock: '当前为模拟功能',
};

export const enUS: LocaleText = {
  whatIsAntdX: 'What is Ant Design X?',
  howToInstall: 'How to quickly install and import components?',
  newAGIHybridUI: 'New AGI Hybrid UI',
  today: 'Today',
  yesterday: 'Yesterday',
  hotTopics: 'Hot Topics',
  designGuide: 'Design Guide',
  intent: 'Intent',
  role: 'Role',
  conversation: 'Conversation',
  hybridUI: 'Hybrid UI',
  aiUnderstandsUserNeeds: 'AI understands user needs and provides solutions',
  aiPublicImage: "AI's public image",
  naturalConversation: 'Natural and smooth conversation experience',
  guiWithNaturalConversation: 'Perfect integration of GUI and natural conversation',
  newConversation: 'New Conversation',
  rename: 'Rename',
  delete: 'Delete',
  requestInProgress: 'Request is in progress, please wait for the request to complete.',
  demoButtonNoFunction: 'Demo button, no actual function',
  helloAntdXAgent: 'Hello, I am Ant Design X Agent',
  antdXDescription: 'An AGI product interface solution based on Ant Design, creating a superior intelligent visual experience, helping product design and development.',
  askMeAnything: 'Please enter your question...',
  DeepThinking: 'Deep thinking',
  CompleteThinking: 'Deep thinking completed',
  noData: 'No Data',
  modelIsRunning: 'Model is running',
  modelExecutionCompleted: 'Model execution completed',
  executionFailed: 'Execution failed',
  aborted: 'Aborted',
  curConversation: 'Current Conversation',
  nowNenConversation: 'It is now a new conversation.',
  retry: 'retry',
  isMock: 'It is Mock',
};

// ==================== 常量配置 ====================
export interface ConversationItem {
  key: string;
  label: string;
  group: string;
}

export const getDefaultConversations = (t: LocaleText): ConversationItem[] => [
  {
    key: 'default-0',
    label: t.whatIsAntdX,
    group: t.today,
  },
  {
    key: 'default-1',
    label: t.howToInstall,
    group: t.yesterday,
  },
  {
    key: 'default-2',
    label: t.newAGIHybridUI,
    group: t.yesterday,
  },
];

export interface HotTopic {
  key: string;
  description: string;
  icon: React.ReactNode;
}

export interface HotTopicsConfig {
  key: string;
  label: string;
  children: HotTopic[];
}

export const getHotTopics = (t: LocaleText): HotTopicsConfig => ({
  key: '1',
  label: t.hotTopics,
  children: [
    {
      key: '1-1',
      description: t.whatIsAntdX,
      icon: <span style={{ color: '#f93a4a', fontWeight: 700 }}>1</span>,
    },
    {
      key: '1-2',
      description: t.howToInstall,
      icon: <span style={{ color: '#ff6565', fontWeight: 700 }}>2</span>,
    },
    {
      key: '1-3',
      description: t.newAGIHybridUI,
      icon: <span style={{ color: '#ff9c6e', fontWeight: 700 }}>3</span>,
    },
  ],
});

export interface DesignGuideItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  description: string;
}

export interface DesignGuideConfig {
  key: string;
  label: string;
  children: DesignGuideItem[];
}

export const getDesignGuide = (t: LocaleText): DesignGuideConfig => ({
  key: '2',
  label: t.designGuide,
  children: [
    {
      key: '2-1',
      icon: <QuestionCircleOutlined />,
      label: t.intent,
      description: t.aiUnderstandsUserNeeds,
    },
    {
      key: '2-2',
      icon: <QuestionCircleOutlined />,
      label: t.role,
      description: t.aiPublicImage,
    },
    {
      key: '2-3',
      icon: <QuestionCircleOutlined />,
      label: t.conversation,
      description: t.naturalConversation,
    },
    {
      key: '2-4',
      icon: <QuestionCircleOutlined />,
      label: t.hybridUI,
      description: t.guiWithNaturalConversation,
    },
  ],
});

export interface SenderPrompt {
  key: string;
  description: string;
  icon: React.ReactNode;
}

export const getSenderPrompts = (t: LocaleText): SenderPrompt[] => [
  {
    key: '1',
    description: t.whatIsAntdX,
    icon: <QuestionCircleOutlined />,
  },
  {
    key: '2',
    description: t.howToInstall,
    icon: <QuestionCircleOutlined />,
  },
  {
    key: '3',
    description: t.newAGIHybridUI,
    icon: <QuestionCircleOutlined />,
  },
];

export interface ThoughtChainConfig {
  loading: {
    title: string;
    status: 'loading';
  };
  updating: {
    title: string;
    status: 'loading';
  };
  success: {
    title: string;
    status: 'success';
  };
  error: {
    title: string;
    status: 'error';
  };
  abort: {
    title: string;
    status: 'abort';
  };
}

export const getThoughtChainConfig = (t: LocaleText): ThoughtChainConfig => ({
  loading: {
    title: t.modelIsRunning,
    status: 'loading',
  },
  updating: {
    title: t.modelIsRunning,
    status: 'loading',
  },
  success: {
    title: t.modelExecutionCompleted,
    status: 'success',
  },
  error: {
    title: t.executionFailed,
    status: 'error',
  },
  abort: {
    title: t.aborted,
    status: 'abort',
  },
});
