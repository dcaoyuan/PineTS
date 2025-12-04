const barmerge = {
    gaps_on: 'gaps_on',
    gaps_off: 'gaps_off',
    lookahead_on: 'lookahead_on',
    lookahead_off: 'lookahead_off',
};

Object.defineProperty(barmerge, 'isBarMerge', {
    enumerable: false,
    value(value) {
        return Object.values(barmerge).includes(value);
    },
});

Object.freeze(barmerge);

export default barmerge;
