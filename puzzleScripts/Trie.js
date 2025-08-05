import { validateWord, getRandomLetter, isPalindrome } from './util.js';

class TrieNode {
    constructor() {
        this.children = new Array(26).fill(null);
        this.endOfWord = false;
        this.minLen = Infinity;
        this.maxLen = 0;
    }
}

class Trie {
    constructor() {
        this.root = new TrieNode();
        this.size = 0;
        this.minLen = Infinity;
        this.maxLen = 0;
    }
    // returns false if word already existed, otherwise returns true
    insert(word) {
        const n = word.length;
        let node = this.root;
        for (let i = 0; i < n; i++) {
            const idx = word.charCodeAt(i) - 97;
            if (node.children[idx] === null) {
                node.children[idx] = new TrieNode();
            }
            node.minLen = Math.min(node.minLen, n);
            node.maxLen = Math.max(node.maxLen, n);
            node = node.children[idx];
        }
        // check if word was already exists
        if (node.endOfWord) {
            return false;
        }
        this.size++;
        node.endOfWord = true;
        return true;
    }
    // returns boolean for whether the word exists in our Trie
    search(word) {
        const n = word.length;
        let node = this.root;
        for (let i = 0; i < n; i++) {
            const idx = word.charCodeAt(i) - 97;
            // check if next character has no node
            if (node.children[idx] === null) {
                return false;
            }
            node = node.children[idx];
        }
        return node.endOfWord;
    }
    // fetch a random word from the Trie
    /*
        Grid layout: (x increases from left to right, y increases from top to bottom)
        +---------x
        |
        |
        |
        |
        y
    */    
    getRandom(grid, x, y, d, minLen, maxLen, used) {
        if (d === null) {
            throw new Error('Invalid direction provided');
        }
        return this.#helper(grid, x, y, d, minLen, maxLen, used, 0);  
    }
    // function for easily retrieving the cell value when indexing over a word, given a starting position
    #getCell(grid, x, y, d, pos) {
        const fx = x + d[0] * pos;
        const fy = y + d[1] * pos;
        const dim = grid.length;
        if (fx < 0 || fy < 0 || fx >= dim || fy >= dim) {
            return null;
        }
        return grid[fx][fy] ?? '';
    }
    #helper(grid, x, y, d, minLen, maxLen, used, iterations) {
        // exit early if maxLen is shorter than all words in trie or if minLen is longer than all words in trie
        if (maxLen < this.minLen || minLen > this.maxLen) {
            return null;
        }
        if (iterations >= 32) {
            return null;
        }
        const words = [];
        const curr = [];
        let node = this.root;
        let pos = 0;
        // search while trie node is valid, maxLen has not been exceeded, and maxLen from trie node is valid for current minLen 
        while (node !== null && pos < maxLen && node.maxLen >= minLen) {
            // check if shortest possible word branching from current node will not fit (out of bounds check)
            const check = this.#getCell(grid, x, y, d, node.minLen-1);
            if (check === null) {
                break;
            }
            const cell = this.#getCell(grid, x, y, d, pos);
            // select random non-null index for selected next TrieNode to process 
            let idx = null;
            // check if cell does not have a set character yet (empty string)
            if (cell === '') {
                let cnt = 0;
                for (const child of node.children) {
                    if (child !== null) {
                        cnt++;
                    }
                }
                if (cnt === 0) {
                    break;
                } 
                const r = Math.floor(Math.random() * cnt) + 1;
                cnt = 0;
                for (let i = 0; i < 26; i++) {
                    const child = node.children[i];
                    if (child !== null) {
                        cnt++;
                    }
                    if (cnt === r) {
                        idx = i;
                        break;
                    }
                }
            } else {
                // cell has a set character
                idx = cell.charCodeAt(0) - 97;
                // check if the child is valid
                if (node.children[idx] === null) {
                    break;
                }
            }
            // use cell if it has been set (not empty string), or else convert ascii code to string
            curr.push(cell || String.fromCharCode(97 + idx));
            node = node.children[idx];
            const word = curr.join('');
            if (node.endOfWord && validateWord(word, used)) {
                words.push(word);
            }
            pos++;
        }
        const n = words.length;
        // if no words were found, try again
        // if one word was found, return that word
        if (n <= 1) {
            return n === 1 ? words[0] : this.#helper(grid, x, y, d, minLen, maxLen, used, iterations+1);
        }
        // use weighted randomization (leaning towards longer words)
        // weights are 2,3,...,n+1. sum = ((n+2)(n+1)/2)-1
        const k = 1;
        const total = ((n+2)*(n+1)/2)-(k*(k+1)/2);
        const r = Math.random() * total;
        for (let i = 2, curr = 0; i <= n+1; i++) {
            curr += i;
            if (curr > r) {
                return words[i-2];
            }
        }
    }
    load(words, min = 5, max = 20) {
        for (const w of words) {
            // dont insert word if its length is not in the interval [min,max]
            if (w.length < min || w.length > max || isPalindrome(w)) {
                continue;
            }
            // trim and set to lower case for consistency
            const wf = w.trim().toLowerCase();
            this.insert(wf);
            this.minLen = Math.min(this.minLen, wf.length);
            this.maxLen = Math.max(this.maxLen, wf.length);
        }
    }
    // for each cell (x,y) in the grid, consider all possible directions. use trie to find  
    // after finding all instances of each word, check the frequencies
    // remove any duplicates by checking the original starting location
    verifyAndRepairGrid(grid, words, wordPos, dirMap, cnt = 0) {
        const freq = new Map();
        for (const w of words) {
            freq.set(w, []);
        }
        const directions = [
            [0, -1],
            [1, 0],
            [0, 1],
            [-1, 0],
            [1, -1],
            [1, 1],
            [-1, 1],
            [-1, -1]
        ];
        const n = grid.length;
        for (let x = 0; x < n; x++) {
            for (let y = 0; y < n; y++) {
                for (const d of directions) {
                    // skip this direction if the word failed
                    const px = x + d[0] * (this.root.minLen - 1);
                    const py = y + d[1] * (this.root.minLen - 1);
                    if (px < 0 || py < 0 || px >= n || py >= n) {
                        continue;
                    }
                    const curr = [];
                    let node = this.root;
                    let pos = 0;
                    while (true) {
                        const dx = x + d[0] * pos;
                        const dy = y + d[1] * pos;
                        if (dx < 0 || dy < 0 || dx >= n || dy >= n) {
                            break;
                        }
                        const idx = grid[dx][dy].charCodeAt(0) - 97;
                        if (node.children[idx] === null) {
                            break;
                        }
                        node = node.children[idx];85
                        curr.push(grid[dx][dy]);
                        if (node.endOfWord) {
                            const word = curr.join('');
                            freq.get(word).push([x,y,d]);
                            break;
                        }
                        pos++;
                    }
                }
            }
        }
        let failure = false;
        let valid = true; 
        for (const [word, occurrences] of freq.entries()) {
            if (failure) {
                break;
            }
            // check if word is completely missing (should never happen)
            if (occurrences.length === 0) {
                throw new Error('Word is missing from the grid', word);
            }
            // check if there are too many occurrences
            if (occurrences.length > 1) {
                const truePos = wordPos.get(word);
                let eq = true;
                valid = false;
                for (const [px,py,d] of occurrences) {
                    // skip if this in the intended word placement
                    if (truePos[0] === px && truePos[1] === py) {
                        continue;
                    }
                    eq = false;
                    const n = word.length;
                    let flag = false;
                    for (let i = 0; i < n; i++) {
                        const dx = px + d[0] * i;
                        const dy = py + d[1] * i;
                        // check if letter belongs to a word
                        if (dirMap.has(`${dx},${dy}`)) {
                            continue;
                        }
                        // letter can be changed freely
                        grid[dx][dy] = getRandomLetter();
                        flag = true;
                        break;
                    }
                    // if flag is true, then the worst case has happened. at this point, only option is to scrap the puzzle
                    if (!flag) {
                        failure = true;
                        break;
                    }
                }
                // is eq is true, then the word has multiple occurrences stemming from the same point, so puzzle must be scrapped
                if (eq) {
                    failure = true;
                    break;
                }
            }
        }
        // if the frequency of all words was 0, then exit early (nothing to do)
        if (valid) {
            return true;
        }
        // if the puzzle cannot recover, then exit
        if (failure) {
            return false;
        }
        return this.verifyAndRepairGrid(grid, words, wordPos, dirMap, cnt+1);
    }
}

export default Trie;