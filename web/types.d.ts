interface BaseType<MG>{
    name: string;
    disabled?: boolean;
    website: string;
    ex_tip?: string;
    models: MG;
}

interface RateLimites{
    rps?: number;
    tps?: number;
    rpm?: number;
    tpm?: number;
    rph?: number;
    tph?: number;
    rpd?: number;
    tpd?: number;
    rpmo?: number;
    tpmo?: number;
    ex_limits_zh?: string;
    ex_limits_en?: string;
    shared: boolean;
}

interface ModelsGroup{
    ratelimits: RateLimits;
    ids: string[];
    ellipsis: boolean;
}
type ModelsToGet = {
    type: 'modelsdev';
    ratelimits: RateLimits;
    provider_name_regex_match: string;
    model_id_regex_match?: string;
    prize_io_0?: boolean;
} | {
    type: 'apiget';
    ratelimits: RateLimits;
    model_id_regex_match?: string;
    keyref: string;
    custom_model_fetch_url?: string;
    eval?: string; // js表达式，传入api返回结果，输出结果数组
}

type ProviderFileType = BaseType<ModelsGroup[] | ModelsToGet>;
type FlcjsonType = BaseType<ModelsGroup[]>[];