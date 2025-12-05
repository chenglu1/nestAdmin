import type { TransformMessage, XRequestOptions } from '@ant-design/x-sdk';
import { AbstractChatProvider, AbstractXRequestClass } from '@ant-design/x-sdk';
import { sendChatRequest, type ChatRequestParams, type ChatResponse } from '@/utils/request';

export interface MockInput {
  message: {
    role: string;
    content: string;
  };
  userAction?: string;
  model?: string;
}

export interface MockOutput {
  text?: string;
  ext_text?: string;
}

export interface MockMessage {
  content: MockOutput;
  role: string;
}

// ==================== Mock Request ====================
export class MockRequest<
  Input extends MockInput = MockInput,
  Output extends MockOutput = MockOutput,
> extends AbstractXRequestClass<Input, Output> {
  _isTimeout = false;
  _isStreamTimeout = false;
  _isRequesting = false;
  _abortController: AbortController | null = null;

  get asyncHandler(): Promise<void> {
    return Promise.resolve();
  }

  get isTimeout(): boolean {
    return this._isTimeout;
  }

  get isStreamTimeout(): boolean {
    return this._isStreamTimeout;
  }

  get isRequesting(): boolean {
    return this._isRequesting;
  }

  get manual(): boolean {
    return true;
  }

  run(params?: Input | undefined): void {
    this._isRequesting = true;
    // 创建新的 AbortController
    this._abortController = new AbortController();
    const { callbacks } = this.options;
    const userMessage = params?.message?.content || '';
    // 从params中获取模型参数，如果没有则使用默认值
    const model = params?.model || 'gpt-3.5-turbo';

    // 使用指定的 API 接口获取 AI 回复
    const fetchAIResponse = async () => {
      try {
        const requestParams: ChatRequestParams = {
          model,
          messages: [
            {
              role: 'user',
              content: userMessage
            }
          ],
          stream: true // 启用流式输出
        };

        let accumulatedText = '';

        // 使用sendChatRequest函数发送聊天请求，传入signal
        await sendChatRequest(
          requestParams,
          (chunk: ChatResponse) => {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              accumulatedText += content;
              // 直接调用onUpdate，确保实时更新
              callbacks?.onUpdate?.({ text: content } as Output, new Headers());
            }
          },
          this._abortController?.signal
        );

        callbacks?.onSuccess?.([{ text: accumulatedText }] as Output[], new Headers());
        this._isRequesting = false;
      } catch (error: any) {
        // 检查是否是用户主动中止
        if (error.name === 'AbortError') {
          console.log('Request aborted by user');
          callbacks?.onError?.(new Error('Request aborted'));
        } else {
          console.error('Error fetching AI response:', error);
          callbacks?.onError?.(error as Error);
        }
        this._isRequesting = false;
      }
    };

    fetchAIResponse();
  }

  abort(): void {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
    this._isRequesting = false;
  }
}

// ==================== Mock Provider ====================
export class MockProvider<
  ChatMessage extends MockMessage = MockMessage,
  Input extends MockInput = MockInput,
  Output extends MockOutput = MockOutput,
> extends AbstractChatProvider<ChatMessage, Input, Output> {
  private model: string;

  constructor(options: any, model?: string) {
    super(options);
    this.model = model || 'gpt-3.5-turbo';
  }

  transformParams(requestParams: Partial<Input>, options: XRequestOptions<Input, Output>): Input {
    if (typeof requestParams !== 'object') {
      throw new Error('requestParams must be an object');
    }
    if (requestParams.userAction === 'retry') {
      const messages = this.getMessages();
      const queryMessage = (messages || [])?.reverse().find(({ role }) => {
        return role === 'user';
      });
      return {
        message: queryMessage ? { role: queryMessage.role, content: queryMessage.content as string } : { role: 'user', content: '' },
        model: this.model, // 使用存储的模型参数
        ...(options?.params || {}),
        ...(requestParams || {}),
      } as Input;
    }

    return {
      model: this.model, // 使用存储的模型参数
      ...(options?.params || {}),
      ...(requestParams || {}),
    } as Input;
  }

  transformLocalMessage(requestParams: Partial<Input>): ChatMessage {
    return requestParams.message as unknown as ChatMessage;
  }

  transformMessage(info: TransformMessage<ChatMessage, Output>): ChatMessage {
    const { originMessage, chunk } = info || {};
    if (!chunk) {
      return {
        content: originMessage?.content || {},
        role: 'assistant',
      } as ChatMessage;
    }

    const content = originMessage?.content || {};
    return {
      content: {
        text: (content.text || '') + (chunk.text || ''),
        ext_text: (content.ext_text || '') + (chunk.ext_text || ''),
      },
      role: 'assistant',
    } as ChatMessage;
  }
}

/**
 * 🔔 Please replace the BASE_URL, MODEL with your own values.
 */
export const providerCaches = new Map<string, MockProvider>();
export const providerFactory = (conversationKey: string, model?: string) => {
  const cacheKey = `${conversationKey}-${model}`; // 使用conversationKey和model的组合作为缓存键
  if (!providerCaches.get(cacheKey)) {
    providerCaches.set(
      cacheKey,
      new MockProvider({
        request: new MockRequest('Mock Client', {}),
      }, model), // 将模型参数传递给MockProvider
    );
  }
  return providerCaches.get(cacheKey);
};
