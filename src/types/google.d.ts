declare global {
  interface Window {
    gapi?: {
      load: (api: string, callback?: () => void) => void;
      client: {
        init: (config: {
          apiKey: string;
          discoveryDocs: string[];
        }) => Promise<void>;
        setToken: (token: { access_token: string }) => void;
        drive?: {
          files: {
            list: (params: any) => Promise<any>;
          };
        };
      };
    };
  }
}

export {}; 