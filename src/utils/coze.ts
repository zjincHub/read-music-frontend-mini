import Taro from "@tarojs/taro";
import { AIAnalysis } from "src/data/hexagrams";

// Coze API 配置
const COZE_CONFIG = {
  url: "https://api.coze.cn/v1/workflow/stream_run",
  workflowId: "7560698029583237160",
  authorization:
    "Bearer pat_TeJa2KNFiciTPdyQMfFN0zslD3G4fzuji5bAjfsoZVutRe20Kz8BhaBwcqvtgHz2",
};

// Coze API 响应接口
interface CozeResponse {
  statusCode: number;
  data?: string | object;
}

// 调用 Coze API 进行 AI 解卦
export const callCozeAPI = async (inputText: string): Promise<AIAnalysis> => {
  try {
    // 使用 Taro.request 调用 Coze API
    const response: CozeResponse = await Taro.request({
      url: COZE_CONFIG.url,
      method: "POST",
      header: {
        "Content-Type": "application/json",
        Authorization: COZE_CONFIG.authorization,
      },
      data: {
        workflow_id: COZE_CONFIG.workflowId,
        parameters: {
          input: inputText,
        },
      },
    });

    // eslint-disable-next-line no-console
    console.log("Coze API 响应:", response);

    if (response.statusCode === 200 && response.data) {
      const result = response.data;

      // 处理响应数据
      if (result && typeof result === "string") {
        // 解析流式数据
        const lines = result.split("\n");
        let finalContent: AIAnalysis | null = null;

        for (const line of lines) {
          if (line.includes("data:")) {
            try {
              // 提取 data 部分
              const dataMatch = line.match(/data: (.+)$/);
              if (dataMatch) {
                const dataStr = dataMatch[1];
                const dataObj = JSON.parse(dataStr);

                if (dataObj.content) {
                  const contentObj = JSON.parse(dataObj.content);
                  if (contentObj.output) {
                    const outputObj = JSON.parse(
                      contentObj.output,
                    ) as AIAnalysis;
                    if (outputObj.result) {
                      finalContent = outputObj;
                      break; // 找到结果就退出
                    }
                  }
                }
              }
            } catch (parseError) {
              // eslint-disable-next-line no-console
              console.warn("解析流式数据时出错:", parseError);
            }
          }
        }

        if (finalContent) {
          return finalContent;
        } else {
          throw new Error("AI 解卦结果解析失败");
        }
      } else {
        throw new Error("AI 解卦结果为空");
      }
    } else {
      const errorMessage =
        typeof response.data === "object" &&
        response.data &&
        "message" in response.data
          ? (response.data as { message: string }).message
          : "未知错误";
      throw new Error(`API 调用失败: ${response.statusCode} - ${errorMessage}`);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("调用 Coze API 时出错:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("网络错误，请检查网络连接后重试");
    }
  }
};

// 构建 Coze API 的输入参数
export const buildCozeInput = (
  userInput: string,
  hexagramNumber: number,
  hexagramName: string,
  changeYaoNumbers: number[],
): string => {
  const changeYaoText =
    changeYaoNumbers.length > 0
      ? `变爻：${changeYaoNumbers.join("、")}。`
      : "无变爻。";

  return `所求之事：${userInput}；所求卦象：第${hexagramNumber}卦${hexagramName}；${changeYaoText}`;
};
