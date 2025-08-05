import Trie from './Trie.js';
import { wordList, getDirectionString, getDirectionArray, getRandomLetter } from './util.js';

const run = function(n, logging, fails = 0) {
    const t0 = performance.now();
    // build trie
    const trie = new Trie();
    // load the default wordlist
    trie.load(wordList);
    // places the word in the grid (assumes that the placement is valid)
    const placeWord = function(grid, x, y, d, word, dirMap, interFreq, wordPos, obj) {
        const n = word.length;
        const ds = getDirectionString(d);
        if (ds === null) {
            throw new Error('Failed to place word. Bad direction.')
        }
        wordPos.set(word, [x,y]);
        for (let i = 0; i < n; i++) {
            const dx = x + d[0] * i;
            const dy = y + d[1] * i;
            const s = `${dx},${dy}`;
            // update word if space was blank (small opt. + easier updates)
            if (grid[dx][dy] === null) {
                grid[dx][dy] = word[i];
                dirMap.set(s, [ds]);
                obj.spacesUsed++;
                interFreq[1].add(s);
            } else {
                // add additional direction to direction map
                const arr = dirMap.get(s);
                arr.push(ds);
                if (arr.length-1 >= 4) {
                    continue;
                }
                interFreq[arr.length-1].delete(s);
                // will not do anything if arr.length >= 4
                interFreq[arr.length]?.add(s);
            }
        }
    }
    // based on the starting position, select a random "valid" direction
    const getRandomDirection = function(grid, x, y, bannedDir) {
        // exit early if no valid direction exists
        if (bannedDir.length >= 4) {
            return [null, null];
        }
        // prune invalid directions before selecting a random direction
        // to make pruning not overly complex, skip direction if it (or its opposite) is in bannedDir
        const directions = [
            [0, -1],
            [1, 0],
            [0, 1],
            [-1, 0],
            [1, -1],
            [1, 1],
            [-1, 1],
            [-1, -1]
        ].filter(dir => !bannedDir.some(banned => (dir[0] === banned[0] && dir[1] === banned[1]) || (dir[0] === -banned[0] && dir[1] === -banned[1])));
        const n = directions.length;
        if (n === 0) {
            return [null, null];
        }
        const r = Math.floor(Math.random() * n);
        const d = directions[r];
        const mx = d[0] > 0 ? grid.length - x : d[0] < 0 ? x+1 : Infinity;
        const my = d[1] > 0 ? grid.length - y : d[1] < 0 ? y+1 : Infinity;
        return [d, Math.min(mx, my)];
    }
    const getRandomStartingState = function(grid, dirMap, interFreq) {
        // first perform the weighted randomization
        // 55-35-10 selection between 1,2,3 (groups a, b, c respectively)
        // gcd(55,35,10) = 5 -> 11-7-2
        const total = 20; // 11+7+2
        // randomly select non-empty group (repeatedly do this until you get one)
        let r = null;
        let group = null;
        while (true) {
            r = Math.random() * total; // [0,total)
            group = r < 11 ? 1 : r < (11+7) ? 2 : 3;
            if (interFreq[group].size !== 0) {
                break;
            }
        }
        const groupArr = Array.from(interFreq[group]);
        const rpos = groupArr[Math.floor(Math.random() * groupArr.length)];
        const [x,y] = rpos.split(',').map(Number);
        // after starting position has been selected, choose a random "new" direction
        const bannedDir = dirMap.get(rpos)?.map(getDirectionArray) ?? [];
        const [d, maxLen] = getRandomDirection(grid, x, y, bannedDir);   
        // if direction is bad, try again
        if (d === null) {
            return [null];
        }
        // 50/50 chance for using the direction of the flipped direction
        const flipDir = Math.random() < 0.5;
        const maxLenRev = Math.min(
            -d[0] > 0 ? grid.length - x : -d[0] < 0 ? x+1 : Infinity,
            -d[1] > 0 ? grid.length - y : -d[1] < 0 ? y+1 : Infinity
        );
        // return format: [x,y,d,minLen,maxLen]
        if (flipDir) {
            // find offset in the original direciton
            // place word in opposite direction
            const m = Math.floor(Math.random() * maxLen);
            // determine starting position
            const dx = x + d[0] * m;
            const dy = y + d[1] * m;
            // reverse the direction (word should "pass over" randomly selected cell, (x,y), going in the opposite direction)
            d[0] *= -1;
            d[1] *= -1;
            // min length is m+1 (so that randomly selected cell is included)
            // max length is (m+1)+(maxLenRev)-1 = m+maxLenRev (respects boundary for opposite direction)
            return [dx, dy, d, m+1, m+maxLenRev];
        }
        // find offset in the opposite direction
        // place word in the original direction
        const m = Math.floor(Math.random() * maxLenRev);
        // determine starting position
        const dx = x + d[0] * -m;
        const dy = y + d[1] * -m;
        // min length is m+1 (so that randomly selected cell is included)
        // max length is (m+1)+(maxLen)-1 = m+maxLen (respects boundary for original direction)
        return [dx, dy, d, m+1, m+maxLen];
    }
    const generatePuzzleWord = function(trie, grid, x, y, used, dirMap, interFreq, wordPos, obj, d = null, minLen = null, maxLen = null) {
        // if no direction was provided (starting word case), generate one
        if (d === null) {
            const bannedDir = dirMap.get(`${x},${y}`)?.map(getDirectionArray) ?? [];
            [d, maxLen] = getRandomDirection(grid, x, y, bannedDir);
            if (d === null) {
                return false;
            }
            minLen = 0;
        }
        const word = trie.getRandom(grid, x, y, d, minLen, maxLen, used);
        // if no word was retrieved, exit
        if (word === null) {
            return false;
        }
        // word was found, so return true for success (and mark used letters)
        placeWord(grid, x, y, d, word, dirMap, interFreq, wordPos, obj);
        used.push(word);
        return true;
    }
    const validatePuzzle = function(grid, words, wordPos, dirMap) {
        // build a trie with the current words
        // use trie to find all words that exist in a direction
        const wordsTrie = new Trie();
        wordsTrie.load(words);
        // search grid for words in trie
        return wordsTrie.verifyAndRepairGrid(grid, words, wordPos, dirMap);
    }
    const buildPuzzle = function(n, trie) {
        if (fails >= 1e6) {
            throw new Error('Could not build puzzle!');
        }
        // initialize grid
        const grid = Array.from({ length: n }, () => new Array(n).fill(null));
        // keep track of words used 
        const used = [];
        // keep track of # of spaces used
        const obj = { spacesUsed: 0 };
        // mark the direction that was used by the coordinate string "x,y"
        const dirMap = new Map();
        // store the starting positions for each word
        const wordPos = new Map();
        // store sets for the number of words that pass through each cell (either 1,2,3)
        const interFreq = [null, new Set(), new Set(), new Set()];
        // place first word (it should start or cross near the center)
        // for now, force start to be in a 5x5 region the center (might just be better to use a random position overall but we'll see)
        // no. "divide" grid into 16 regions and select starting position to be in the center 4 regions
        const bounds = [Math.floor(n/4), Math.ceil(3*n/4)];
        const diff = bounds[1] - bounds[0];
        // place first word
        const px = bounds[0] + Math.floor(Math.random() * diff);
        const py = bounds[0] + Math.floor(Math.random() * diff);
        generatePuzzleWord(trie, grid, px, py, used, dirMap, interFreq, wordPos, obj);
        // track consecutive failures and exit if it reaches the upper bound
        const failBound = 1000;
        // desired ratio for spaces used to total spaces
        const k = 0.75;
        const desiredSpaces = k * n * n;
        let failCnt = 0;
        // continue until performance ratio is satisfied or until all words have been used
        // latter case is relevant for shorter word lists that can be fully exhausted
        while (obj.spacesUsed < desiredSpaces && used.length < trie.size) {
            const [x,y,d,minLen,maxLen] = getRandomStartingState(grid, dirMap, interFreq);
            // attempt to generate additional word
            if (x === null || generatePuzzleWord(trie, grid, x, y, used, dirMap, interFreq, wordPos, obj, d, minLen, maxLen)) {
                failCnt = 0;
            } else {
                failCnt++;
            }
            if (failCnt >= failBound) {
                break;
            }
        }
        const spaceRatio = 0.85 * n * n;
        const ratio = 100 * obj.spacesUsed / (n*n);
        // fill in the blanks now
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                // add random letter in blank spaces
                if (grid[i][j] === null) {
                    grid[i][j] = getRandomLetter();
                }
            }
        }
        // validate the puzzle
        const status = validatePuzzle(grid, used, wordPos, dirMap);
        // if the puzzle cannot be fixed, then rebuild
        if (!status) {
            fails++;
            return buildPuzzle(n, trie);
        }
        if (logging) {
            console.log(`Expected Spaces Used: ${spaceRatio}`);
            console.log(`Actual Spaces Used: ${obj.spacesUsed}`);
            console.log(`Performance Ratio: ${ratio}%`);
            console.log(`Words Used: ${used.length}`);
            console.log()
            const s = grid.map(r => r.map(e => e ?? '-').join(' ')).join('\n');
            console.log(s);
            console.log();
        }
        return {
            grid,
            used,
            ratio
        };
    }
    const { grid, used, ratio } = buildPuzzle(n, trie);
    const t1 = performance.now();
    return {
        grid,
        ms: t1 - t0,
        used,
        ratio,
        fails
    };
}

export { run };