export class Generico {
    protected name;
    private tsPrivate;
    #truelyPrivateProps = 'There are dozens of us!';
    publicProp = 'What? Like you don\'t have one?';

    constructor(name: string, private promoteMeBro = '') {
        this.name = name; // Old style promotion
        this.tsPrivate = `secret ${name}`;
    }

    publicPropFunc = () => {
        return 'Oof';
    }

    private privatePropFunc = () => {
        return 'Le Oof';
    }

    #newPrivatePropFunc = () => {
        return 'How are you even here Oofs';
    }

    normalFunc(args: object = {}) {
        return `called with ${args}`;
    }

    private privateFunc(args: object = {}) {
        return `private func called with ${args}`;
    }

    #newPrivateFunc(args: object = {}) {
        return `truly private func called with ${args}`;
    }

}
