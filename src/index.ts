import { YNUtil } from '@yesness/util';
import md5 from 'md5';

type CalculateParams<TNode> = {
    nodes: TNode[];
    getID: (node: TNode) => string;
    getSubHash: (node: TNode, hash: (node: TNode) => string) => string[];
};

type NodeState<TNode> = {
    node: TNode;
    dependencies: string[]; // direct dependencies
    baseHash: string[];
    curHash: string;
};

const PLACEHOLDER_STR = '__PLACEHOLDER_';

export class CyclicHash<TNode> {
    /**
     * @return mapping from node ID to hash
     */
    static calculate<TNode>(
        params: CalculateParams<TNode>
    ): Record<string, string> {
        return new CyclicHash(params).calculateImpl();
    }

    private idToNodeState: Record<string, NodeState<TNode>>;

    private constructor(private params: CalculateParams<TNode>) {
        this.idToNodeState = {};
    }

    calculateImpl(): Record<string, string> {
        for (const node of this.params.nodes) {
            this.idToNodeState[this.params.getID(node)] =
                this.getNodeState(node);
        }
        const maxHeight = this.getMaxHeight();
        for (let i = 0; i < maxHeight; i++) {
            this.iterate();
        }
        return YNUtil.mapDictValues(
            this.idToNodeState,
            (state) => state.curHash
        );
    }

    getNodeState(node: TNode): NodeState<TNode> {
        const dependencies: string[] = [];
        const baseHash = this.params.getSubHash(node, (dep: TNode) => {
            const depID = this.params.getID(dep);
            dependencies.push(depID);
            return this.getPlaceholderID(depID);
        });
        return {
            node,
            dependencies,
            baseHash,
            curHash: '',
        };
    }

    iterate() {
        const newHash: Record<string, string> = {};
        for (const [id, state] of Object.entries(this.idToNodeState)) {
            newHash[id] = md5(
                state.baseHash
                    .map((part) => this.replacePlaceholder(part))
                    .join('.')
            );
        }
        for (const [id, hash] of Object.entries(newHash)) {
            this.idToNodeState[id].curHash = hash;
        }
    }

    getPlaceholderID(depID: string): string {
        return `${PLACEHOLDER_STR}${depID}`;
    }

    replacePlaceholder(str: string): string {
        if (str.startsWith(PLACEHOLDER_STR)) {
            const depID = str.slice(PLACEHOLDER_STR.length);
            return this.idToNodeState[depID].curHash;
        } else {
            return str;
        }
    }

    getMaxHeight(): number {
        const closed: string[] = [];
        const getHeight = (id: string) => {
            if (closed.includes(id)) {
                return 0;
            }
            closed.push(id);
            const deps = this.idToNodeState[id].dependencies;
            if (deps.length === 0) {
                return 1;
            }
            const depHeights: number[] = deps.map(getHeight);
            return Math.max(...depHeights) + 1;
        };
        const heights = Object.keys(this.idToNodeState).map(getHeight);
        return Math.max(...heights);
    }
}
