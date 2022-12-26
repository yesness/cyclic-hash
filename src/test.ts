import { CyclicHash } from '.';

export type Node = {
    hash: number;
    deps: string[];
};

function getHashes(nodes: Record<string, Node>) {
    return CyclicHash.calculate({
        nodes: Object.keys(nodes),
        getID: (node: string) => node,
        getSubHash: (id, hash) => {
            const node = nodes[id];
            return [node.hash.toString()].concat(
                node.deps.map((id) => hash(id))
            );
        },
    });
}

console.log(
    'example 1',
    getHashes({
        a: {
            hash: 1,
            deps: ['b'],
        },
        b: {
            hash: 1,
            deps: ['a'],
        },
        c: {
            hash: 1,
            deps: ['c'],
        },
    })
);
console.log(
    'example 2',
    getHashes({
        a: {
            hash: 1,
            deps: ['b'],
        },
        b: {
            hash: 2,
            deps: ['c'],
        },
        c: {
            hash: 1,
            deps: ['d'],
        },
        d: {
            hash: 2,
            deps: ['a'],
        },
        e: {
            hash: 1,
            deps: ['f'],
        },
        f: {
            hash: 2,
            deps: ['e'],
        },
    })
);
console.log(
    'example 3',
    getHashes({
        a: {
            hash: 1,
            deps: ['b', 'c'],
        },
        b: {
            hash: 2,
            deps: ['c'],
        },
        c: {
            hash: 2,
            deps: ['b'],
        },
        d: {
            hash: 1,
            deps: ['e', 'e'],
        },
        e: {
            hash: 2,
            deps: ['e'],
        },
        f: {
            hash: 2,
            deps: ['f'],
        },
        g: {
            hash: 1,
            deps: ['g'],
        },
    })
);
