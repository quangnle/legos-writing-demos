const fnv1s = function () {
    function stringToBytes(str) {
        let ch,
            st,
            re = [];
        for (let i = 0; i < str.length; i++) {
            ch = str.charCodeAt(i); // get char
            st = []; // set up "stack"
            do {
                st.push(ch & 0xff); // push byte to stack
                ch = ch >> 8; // shift value down by 1 byte
            } while (ch);
            // add stack contents to result
            // done because chars have "wrong" endianness
            re = re.concat(st.reverse());
        }
        // return an array of bytes
        return re;
    }

    this.hash = function (str) {
        const FNVPRIME = 0x01000193;
        const FNVINIT = 0x811c9dc5;

        const bytes = stringToBytes(str);
        let hash = FNVINIT;
        for (let i = 0; i < bytes.length; i++) {
            hash *= FNVPRIME;
            hash ^= bytes[i];
        }
        return Math.abs(hash);
    };
};
