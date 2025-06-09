/**
 * 调用native的方法
 * @param method
 * @param params
 */
function sendMessageToFlutter(method: any, params?: any) {
  const message = JSON.stringify({ method: method, params: params });
  if ((window as any).JsBridgeChannel) {
    (window as any).JsBridgeChannel.postMessage(message); // 使用 Flutter 通道发送消息
  } else {
    console.log('Flutter JavaScriptChannel 未准备好');
  }
}
export let statusBarHeight: number | undefined = undefined;

/**
 * 初始化JSBridge以获取Native的变量
 */
export const initJsBridge = () => {
  return new Promise((resolve, reject) => {
    try {
      (window as any).initJsBridge = (props: any) => {
        try {
          const params = JSON.parse(props);
          (window as any).JsBridge = { ...params };
          resolve(true);
        } catch (parseError) {
          reject(parseError);
        } finally {
          // delete (window as any).initJsBridge;
        }
      };
      sendMessageToFlutter('initJsBridge');
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * JSB的setItem
 * @param key
 * @param value
 * @returns
 */
export const setItem = (key: any, value: any) => {
  return new Promise((resolve, reject) => {
    try {
      // 定义回调，处理 Flutter 返回的结果
      (window as any).handleSetItemResult = (result: string) => {
        try {
          // 解析返回结果
          const parsedResult = JSON.parse(result);
          if (parsedResult.status_code == '200') {
            resolve(parsedResult);
          } else {
            reject(new Error(parsedResult.message));
          }
        } catch (parseError) {
          reject(parseError); // 解析错误
        } finally {
          // 清除回调方法
          delete (window as any).handleSetItemResult;
        }
      };
      sendMessageToFlutter('setItem', { key, value });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * JSB的getItem
 * @param key
 * @returns
 */
export const getItem = (key: any) => {
  return new Promise((resolve, reject) => {
    try {
      // 定义回调，处理 Flutter 返回的结果
      (window as any).handleGetItemResult = (result: string) => {
        try {
          // 解析返回结果
          const parsedResult = JSON.parse(result);
          if (parsedResult.status_code == '200') {
            resolve(parsedResult.value);
          } else {
            reject(new Error(parsedResult.message));
          }
        } catch (parseError) {
          reject(parseError); // 解析错误
        } finally {
          // 清除回调方法
          delete (window as any).handleGetItemResult;
        }
      };
      sendMessageToFlutter('getItem', { key });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * JSB的removeItem
 * @param key
 * @returns
 */
export const removeItem = (key: any) => {
  return new Promise((resolve, reject) => {
    try {
      // 定义回调，处理 Flutter 返回的结果
      (window as any).handleRemoveItemResult = (result: string) => {
        try {
          // 解析返回结果
          const parsedResult = JSON.parse(result);
          if (parsedResult.status_code == '200') {
            resolve(parsedResult);
          } else {
            reject(new Error(parsedResult.message));
          }
        } catch (parseError) {
          reject(parseError); // 解析错误
        } finally {
          // 清除回调方法
          delete (window as any).handleRemoveItemResult;
        }
      };
      sendMessageToFlutter('removeItem', { key });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * JSB的openWebView
 * @param key
 * @returns
 */
export const openWebView = (url: any) => {
  sendMessageToFlutter('openWebView', { url });
};


/**
 * JSB的closeWebView
 * @param key
 * @returns
 */
export const closeWebView = () => {
  console.log('wzy')
  sendMessageToFlutter('closeWebView');
};


/**
 * JSB的scanBarcode
 * @returns
 */
export const scanBarcode = (): Promise<{barcode: string}> => {
  return new Promise((resolve, reject) => {
    try {
      // 定义回调，处理 Flutter 返回的结果
      (window as any).handleScanBarcodeResult = (result: string) => {
        try {
          // 解析返回结果
          const parsedResult = JSON.parse(result);
          if (parsedResult.status_code == '200') {
            resolve(parsedResult.value);
          } else {
            reject(new Error(parsedResult.message));
          }
        } catch (parseError) {
          reject(parseError); // 解析错误
        } finally {
          // 清除回调方法
          delete (window as any).handleScanBarcodeResult;
        }
      };
      sendMessageToFlutter('scanBarcode');
    } catch (error) {
      reject(error);
    }
  });
};
