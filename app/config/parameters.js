const PARAMETERS = {

    APP_NAME: 'Epicollect5',
    IS_LOCALHOST: process.env.NODE_ENV === 'production' ? 0 : 1, //for debugging outside of Laravel(production), it is set to 1
    SERVER_URL: 'https://dev.epicollect.net', //to be changed at run time if neeeded
    //SERVER_URL: 'http://localhost/~mirko/opensource/epicollect5-server-os/public',
    PROJECT_HOME_PATH: '/project/',
    PROJECT_LOGO_QUERY_STRING: '?type=photo&name=logo.jpg&format=project_mobile_logo',
    DATA_VIEWER_PATH: '/data',
    DATA_EDITOR_BASE_PATH: 'https://five.epicollect.net', //to be changed at run time if neeeded
    DATA_EDITOR_ADD_ENTRY_PATH: '/add-entry',
    DATA_EDITOR_EDIT_ENTRY_PATH: '/edit-entry',
    API_PROJECT_ENDPOINT: '/api/internal/project/',
    API_MEDIA_ENDPOINT: '/api/internal/media/',
    API_ENTRIES_ENDPOINT: '/api/internal/entries/',
    API_ENTRIES_LOCATIONS_ENDPOINT: '/api/internal/entries-locations/',
    API_DOWNLOAD_ENDPOINT: '/api/internal/download-entries/',
    API_DOWNLOAD_MEDIA_ENDPOINT: '/api/internal/download-media/',
    API_UPLOAD_TEMPLATE_ENDPOINT: '/api/internal/upload-template/',
    API_UPLOAD_HEADERS_ENDPOINT: '/api/internal/upload-headers/',
    API_DOWNLOAD_SUBSET_ENDPOINT: '/api/internal/download-entries-subset/',
    API_UPLOAD_INTERNAL_ENDPOINT: '/api/internal/web-upload/',
    API_BULK_UPLOAD_INTERNAL_ENDPOINT: '/api/internal/bulk-upload/',
    API_UPLOAD_EXTERNAL_ENDPOINT: '/api/upload/',
    API_BULK_UPLOAD_EXTERNAL_ENDPOINT: '/api/bulk-upload/',
    API_ARCHIVE_ENDPOINT: '/api/internal/archive/',
    API_DELETION_ENDPOINT: '/api/internal/deletion/',
    IMAGES_PATH_LARAVEL: '/images/',
    IMAGES_PATH_STANDALONE: '/app/vendor/images/',
    MAP_MARKER_FILENAME: 'marker.png',

    PAGE_TABLE: 'table',
    PAGE_MAP: 'map',
    PAGE_HOME: 'home',

    DRAWER_MAP: 'DRAWER_MAP',
    DRAWER_DOWNLOAD: 'DRAWER_DOWNLOAD',
    DRAWER_ENTRY: 'DRAWER_ENTRY',
    DRAWER_UPLOAD: 'DRAWER_UPLOAD',

    USER: 'USER',
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',

    TABLE_FIXED_HEADERS_TITLE_INDEX: 4, //CHANGE THIS ACCORDINGLY
    TABLE_FIXED_HEADERS_CHILDREN_INDEX: 3,
    TABLE_FIXED_HEADERS_TOTAL: 6, //CHANGE THIS ACCORDINGLY
    TABLE_FIXED_HEADERS_CREATED_AT_INDEX: 5, //CHANGE THIS ACCORDINGLY
    MAX_TITLE_LENGHT: 20,
    MAX_ENTRIES_FOR_UNCLUSTERING: 10000,
    TABLE_UPLOAD_PER_PAGE: 25,
    TABLE_UPLOAD_MAX_ROWS: 150,
    FORMAT_CSV: 'csv',
    FORMAT_JSON: 'json',

    //ESRI satellite -> https://wiki.openstreetmap.org/wiki/Esri#Legal_permissions
    ESRI_TILES_PROVIDER_SATELLITE: 'https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?token=' + process.env.REACT_APP_ESRI_API_TOKEN,
    //https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9
    ESRI_TILES_PROVIDER_ATTRIBUTION: 'Powered by Esri | Esri, Maxar, Earthstar Geographics, and the GIS User Community',

    //Mapbox  imagery https://docs.mapbox.com/api/maps/styles/
    MAPBOX_TILES_PROVIDER_SATELLITE: 'https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=' + process.env.REACT_APP_MAPBOX_API_TOKEN,
    MAPBOX_TILES_PROVIDER_OUTDOOR: 'https://api.mapbox.com/styles/v1/mapbox/outdoors-v11/tiles/{z}/{x}/{y}?access_token=' + process.env.REACT_APP_MAPBOX_API_TOKEN,
    //https://docs.mapbox.com/help/getting-started/attribution/
    MAPBOX_TILES_ATTRIBUTION: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>',

    //high contrast maps http://maps.stamen.com
    STAMEN_HIGH_CONTRAST_TILES_PROVIDER: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}{r}.png',
    STAMEN_TILES_ATTRIBUTION: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',

    //carto https://carto.com/basemaps/
    CARTO_LIGHT_TILES_PROVIDER: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
    CARTO_TILES_ATTRIBUTION: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attribution">CARTO</a>',

    //OSM tiles
    OSM_TILES_PROVIDER: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    OSM_TILES_ATTRIBUTION: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',

    SVGNS: 'http://www.w3.org/2000/svg',
    FILTER_DISTRIBUTION: 'distribution',
    FILTER_DISTRIBUTION_DEFAULT_OPTION: 'Pick question',
    FILTER_TIMELINE: 'timeline',

    PHOTO_EXT: '.jpg',
    AUDIO_EXT: '.mp4',
    AUDIO_EXT_IOS: '.wav', //ios audio recording is only wav
    VIDEO_EXT: '.mp4',

    ALLOWED_ORDERING_COLUMNS: ['title', 'created_at'],
    ALLOWED_ORDERING: ['ASC', 'DESC'],

    DEFAULT_ORDERING_COLUMN: 'created_at',
    DEFAULT_ORDERING: 'DESC',

    ORDER_BY: {
        NEWEST: 'Newest',
        OLDEST: 'Oldest',
        AZ: 'A - Z',
        ZA: 'Z - A'
    },

    AUTH_ERROR_CODES: [
        'ec5_70',
        'ec5_71',
        'ec5_77',
        'ec5_78',
        'ec5_50',
        'ec5_51'
    ],

    PROJECT_OUTDATED_ERROR_CODES: [
        'ec5_132',
        'ec5_201'
    ],

    ENTRY_ADD: 'ADD',
    ENTRY_EDIT: 'EDIT',
    ENTRY_UPLOAD: 'UPLOAD',

    //Error codes which should stop all entry uploads, ie project does not exist, user not authenticated etc
    UPLOAD_STOPPING_ERROR_CODES: [
        'ec5_11',
        'ec5_50',
        'ec5_51',
        'ec5_70',
        'ec5_71',
        'ec5_77',
        'ec5_78',
        'ec5_116',
        'ec5_132',
        'ec5_201',
        'ec5_202'
    ],

    ENTRY: 'entry',
    ENTRIES_TABLE: 'entries',

    BRANCH_ENTRY: 'branch-entry',
    BRANCH_ENTRIES_TABLE: 'branch_entries',

    JUMPS: {
        IS: 'IS',
        IS_NOT: 'IS_NOT',
        NO_ANSWER_GIVEN: 'NO_ANSWER_GIVEN',
        ALL: 'ALL',
        END_OF_FORM: 'END'
    },

    INPUT_TYPES: {
        EC5_TEXT_TYPE: 'text',
        EC5_PHONE_TYPE: 'phone',
        EC5_TEXTAREA_TYPE: 'textarea',
        EC5_INTEGER_TYPE: 'integer',
        EC5_DECIMAL_TYPE: 'decimal',
        EC5_DATE_TYPE: 'date',
        EC5_TIME_TYPE: 'time',
        EC5_RADIO_TYPE: 'radio',
        EC5_CHECKBOX_TYPE: 'checkbox',
        EC5_DROPDOWN_TYPE: 'dropdown',
        EC5_BARCODE_TYPE: 'barcode',
        EC5_LOCATION_TYPE: 'location',
        EC5_AUDIO_TYPE: 'audio',
        EC5_VIDEO_TYPE: 'video',
        EC5_PHOTO_TYPE: 'photo',
        EC5_BRANCH_TYPE: 'branch',
        EC5_GROUP_TYPE: 'group',
        EC5_README_TYPE: 'readme',
        EC5_SEARCH_SINGLE_TYPE: 'searchsingle',
        EC5_SEARCH_MULTIPLE_TYPE: 'searchmultiple',
        EC5_DATASET_SINGLE_TYPE: 'datasetsingle',
        EC5_DATASET_MULTIPLE_TYPE: 'datasetmultiple'
    },

    BULK_UPLOADABLE_TYPES: [
        'text',
        'phone',
        'textarea',
        'integer',
        'decimal',
        'date',
        'time',
        'radio',
        'checkbox',
        'dropdown',
        'barcode',
        'location',
        'searchsingle',
        'searchmultiple'
    ],

    BULK_MAX_FILE_SIZE_BYTES: 1000000,

    INPUT_ANSWER_MAX_LENGTHS: {
        EC5_TEXT_TYPE: 255,
        EC5_TEXTAREA_TYPE: 1000,
        EC5_INTEGER_TYPE: 255,
        EC5_DECIMAL_TYPE: 255,
        EC5_DATE_TYPE: 24,
        EC5_TIME_TYPE: 24,
        EC5_RADIO_TYPE: 13,
        //EC5_CHECKBOX_TYPE: '',
        EC5_DROPDOWN_TYPE: 13,
        EC5_BARCODE_TYPE: 255,
        //EC5_LOCATION_TYPE: '',
        EC5_AUDIO_TYPE: 51,
        EC5_VIDEO_TYPE: 51,
        EC5_PHOTO_TYPE: 51,
        EC5_BRANCH_TYPE: 0,
        EC5_GROUP_TYPE: 0
    },

    CEll_TYPES: {
        BRANCH: 'CellBranch',
        CHILDREN: 'CellChildren',
        MEDIA: 'CellMedia',
        TEXT: 'CellText'
    },

    MULTIPLE_ANSWERS_TYPES: ['radio', 'checkbox', 'dropdown', 'searchsingle', 'searchmultiple'],
    MULTIPLE_ANSWERS_TYPES_AS_ARRAY: ['checkbox', 'searchsingle', 'searchmultiple'],
    MEDIA_TYPES: ['audio', 'photo', 'video'],

    //date formats
    DATE_FORMAT_1: 'dd/MM/YYYY',
    DATE_FORMAT_2: 'MM/dd/YYYY',
    DATE_FORMAT_3: 'YYYY/MM/dd',
    DATE_FORMAT_4: 'MM/YYYY',
    DATE_FORMAT_5: 'dd/MM',

    //time formats
    TIME_FORMAT_1: 'HH:mm:ss',
    TIME_FORMAT_2: 'hh:mm:ss',
    TIME_FORMAT_3: 'HH:mm',
    TIME_FORMAT_4: 'hh:mm',
    TIME_FORMAT_5: 'mm:ss',

    LABELS: {
        DELETE_ENTRY_SUCCESS: 'Entry deleted',
        FILE_UPLOAD_ERROR: 'Invalid file',
        FILE_UPLOAD_ERROR_NO_ROWS: 'Invalid file, no entries found',
        FILE_SIZE_ERROR: 'File size exceeded',
        FILE_MAPPING_ERROR: 'File mapping does not match',
        FILE_UUID_ERROR: 'File contains duplicate ec5_uuid values',
        FILE_BRANCH_UUID_ERROR: 'File contains duplicate ec5_branch_uuid values',
        FILE_DOWNLOAD_ERROR: 'Cannot download file',
        DELETE_ENTRY_ERROR: 'Error, entry not deleted'
    },

    TOAST_OPTIONS: {
        SUCCESS: {
            closeButton: false,
            timeOut: 1000,
            extendedTimeOut: 0,
            showAnimation: 'animated fadeIn',
            hideAnimation: 'animated fadeOut',
            preventDuplicates: true
        },
        ERROR: {
            closeButton: true,
            timeOut: 3000,
            extendedTimeOut: 0,
            showAnimation: 'animated fadeIn',
            hideAnimation: 'animated fadeOut',
            preventDuplicates: true
        }
    },
    USER_PERMISSIONS: {
        CAN_DELETE: [
            'creator',
            'manager',
            'curator'
        ],
        CAN_EDIT: [
            'creator',
            'manager',
            'curator'
        ]
    },
    PROJECT_ROLES: {
        CREATOR: 'creator',
        MANAGER: 'manager',
        CURATOR: 'curator',
        COLLECTOR: 'collector',
        VIEWER: 'viewer'
    },
    TIMEFRAME: {
        LIFETIME: 'Lifetime',
        TODAY: 'Today',
        LAST_7_DAYS: 'Last 7 days',
        LAST_30_DAYS: 'Last 30 days',
        YEAR: 'Current year',
        CUSTOM: 'Custom'
    },
    COOKIES: {
        DOWNLOAD_ENTRIES: 'epicollect5-download-entries'
    },
    THEME: {
        DEEP_PURPLE: '#673B91',
        HOT_PINK: '#C159B3'
    },
    DELAY: {
        SHORT: 250,
        MEDIUM: 500,
        LONG: 1000
    },
    MAP_OVERLAYS: {
        CLUSTERS: 'Clusters',
        HEATMAP: 'Heatmap',
        MARKERS: 'Markers'
    },
    CAN_BULK_UPLOAD: {
        NOBODY: 'nobody',
        MEMBERS: 'members',
        EVERYBODY: 'everybody'
    },
    PROJECT_ACCESS: {
        PRIVATE: 'private',
        PUBLIC: 'public'
    }
};

export default PARAMETERS;

