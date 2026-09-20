declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve?: (handler: (req: Request) => Response | Promise<Response>) => void;
  [key: string]: any;
};

declare module "https://deno.land/std*" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
  export function serveListener(listener: any, handler: any): any;
  export * from "http";
}

declare module "https://esm.sh/@supabase/supabase-js*" {
  export * from "@supabase/supabase-js";
}

declare module "https://deno.land/x/*" {
  const mod: any;
  export default mod;
  export const postgres: any;
}
