import { NextApiRequest, NextApiResponse } from 'next';

declare type ChatApiOptions = {
    db?: string;
    collection?: string;
    webhooks: string[];
};
declare const _default: (options: ChatApiOptions) => (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

export { _default as default };
