export default [
    {
        method: 'GET',
        path: '/admin',
        handler: 'controller.index',
        config: {
            policies: [],
        },
    },
]

