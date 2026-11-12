export default {
    plugins: {
        'postcss-pxtorem': {
            rootValue: 16,
            unitPrecision: 5,
            propList: ['*'],
            selectorBlackList: [],
            replace: true,
            mediaQuery: false,
            minPixelValue: 0,
            exclude: /(?:(?:^|[\\/])src[\\/]features[\\/](?:splendor|othello|yinsh|quoridor|hex|hive|fugitive|warchest|loveletter|sixnimmt|forsale|onitama|cantstop|game-core)[\\/]|[\\/]src[\\/](?:features[\\/](?:acquire|davinci|home)|components[\\/]GameUI)[\\/]|[\\/]src[\\/]styles[\\/]game-mobile-layout\.css$)/,
        },
    },
};
