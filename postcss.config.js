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
            exclude: /(?:(?:^|[\\/])src[\\/]features[\\/](?:splendor|othello|yinsh|quoridor|hex|fugitive|warchest|loveletter|sixnimmt|onitama)[\\/]|[\\/]src[\\/](?:features[\\/](?:acquire|davinci)|components[\\/]GameUI)[\\/])/,
        },
    },
};
