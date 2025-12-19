// Known Pine Script namespaces that might be used as functions or objects
export const KNOWN_NAMESPACES = ['ta', 'math', 'request', 'array', 'input'];

// All known data variables in the context
export const CONTEXT_DATA_VARS = ['open', 'high', 'low', 'close', 'volume', 'hl2', 'hlc3', 'ohlc4', 'openTime', 'closeTime'];

// All known Pine variables in the context
export const CONTEXT_PINE_VARS = [
    //namespaces
    ...KNOWN_NAMESPACES,
    //plots
    'plotchar',
    'plot',

    //declarations
    'indicator',
    'strategy',
    'library',

    //
    'fixnan',
    'na',
    'color',
    'nz',
    'str',
    'box',
    'line',
    'label',
    'table',
    'map',
    'matrix',
    'log',
    'map',
    //types
    'bool',

    //market info
    'timeframe',
    'syminfo',
    'barstate',

    //builtin variables
    'bar_index',
    'last_bar_index',
    'last_bar_time',

    // Pine Script enum types
    'order',
    'currency',
    'display',
    'dayofweek',
];

// All known core variables in the context
export const CONTEXT_CORE_VARS = ['na', 'nz', 'plot', 'plotchar', 'color'];
