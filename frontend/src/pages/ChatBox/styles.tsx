import { createStyles } from 'antd-style';

export const useChatBoxStyles = createStyles(({ token, css }) => {
  return {
    layout: css`
      width: 100%;
      height: 100vh;
      display: flex;
      background: ${token.colorBgContainer};
      font-family: AlibabaPuHuiTi, ${token.fontFamily}, sans-serif;
    `,
    // sider 样式
    sider: css`
      background: ${token.colorBgLayout}80;
      width: 280px;
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 0 12px;
      box-sizing: border-box;
    `,
    logo: css`
      display: flex;
      align-items: center;
      justify-content: start;
      padding: 0 24px;
      box-sizing: border-box;
      gap: 8px;
      margin: 24px 0;

      span {
        font-weight: bold;
        color: ${token.colorText};
        font-size: 16px;
      }
    `,
    conversations: css`
      flex: 1;
      overflow-y: auto;
      margin-top: 12px;
      padding: 0;

      .ant-conversations-list {
        padding-inline-start: 0;
      }
    `,
    sideFooter: css`
      border-top: 1px solid ${token.colorBorderSecondary};
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `,
    siderUserFooter: css`
      border-top: 1px solid ${token.colorBorderSecondary};
      padding: 8px;
      display: flex;
      flex-direction: column;
      .user-info-card {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .user-avatar-wrapper {
        position: relative;
      }
      .user-info-text {
        flex: 1;
      }
      .user-name {
        font-weight: 500;
        font-size: 14px;
        margin-bottom: 2px;
      }
      .user-role {
        font-size: 12px;
        color: ${token.colorTextSecondary};
      }
      .user-menu-btn {
        padding: 0;
      }
    `,
    // chat list 样式
    chat: css`
      height: 100%;
      width: calc(100% - 280px);
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      padding-top: ${token.paddingLG}px;
      padding-bottom: 0;
      align-items: center;
      .ant-bubble-content-updating {
        background-image: linear-gradient(90deg, #ff6b23 0%, #af3cb8 31%, #53b6ff 89%);
        background-size: 100% 2px;
        background-repeat: no-repeat;
        background-position: bottom;
      }
      // 确保气泡内容占满整个宽度
      .ant-bubble {
        max-width: 100% !important;
      }
      .ant-bubble-content {
        max-width: 100%;
      }
      .ant-x-markdown {
        max-width: 100%;
      }
    `,
    chatPrompt: css`
      .ant-prompts-label {
        color: #000000e0 !important;
      }
      .ant-prompts-desc {
        color: #000000a6 !important;
        width: 100%;
      }
      .ant-prompts-icon {
        color: #000000a6 !important;
      }
    `,
    chatList: css`
      display: flex;
      flex: 1;
      flex-direction: column;
      align-items: center;
      width: 100%;
      overflow-y: auto;
    `,
    placeholder: css`
      padding-top: 32px;
      width: 100%;
      padding-inline: ${token.paddingLG}px;
      box-sizing: border-box;
    `,
    // sender 样式
    sender: css`
      width: 100%;
      max-width: 840px;
      margin: 0 auto;
    `,
    senderPrompt: css`
      width: 100%;
      max-width: 840px;
      margin: 0 auto;
      color: ${token.colorText};
    `,
    chatSender: css`
      margin-inline: 24px;
      padding: ${token.paddingLG}px 0;
      border-top: 1px solid ${token.colorBorderSecondary};
      background: ${token.colorBgContainer};
    `,
  };
});
