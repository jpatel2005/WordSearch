import wordList from './wordList.js';

const letters = 'abcdefghijklmnopqrstuvwxyz';
// Note that the vectors are technically of the form [dy,dx]
const getDirectionString = function(d) {
  return d[1] === 0 && d[0] === -1 ? 'N' :
         d[1] === 1 && d[0] === 0 ? 'E' :
         d[1] === 0 && d[0] === 1 ? 'S' :
         d[1] === -1 && d[0] === 0 ? 'W' :
         d[1] === 1 && d[0] === -1 ? 'NE' :
         d[1] === 1 && d[0] === 1 ? 'SE' :
         d[1] === -1 && d[0] === 1 ? 'SW' :
         d[1] === -1 && d[0] === -1 ? 'NW' : null;
}
const getDirectionArray = function(d) {
  return d === 'N' ? [-1,0] :
         d === 'E' ? [0,1] :
         d === 'S' ? [1,0] : 
         d === 'W' ? [0,-1] :
         d === 'NE' ? [-1,1] :
         d === 'SE' ? [1,1] :
         d === 'SW' ? [1,-1] :
         d === 'NW' ? [-1,-1] : null;
}
// need to check that these two conditions are both false for validation:
// (1) word or "reverse" word is a substring of a, where a is a word in "used"
// (2) b or "reverse" b is a substring of word, where b is a word in "used"
const validateWord = function(word, used) {
  const revWord = word.split('').reverse().join('');
  return !used.some(u => {
    const revU = u.split('').reverse().join('');
    return (word.includes(u) || u.includes(word) || word.includes(revU) || u.includes(revWord));
  });
}
const getRandomLetter = function() {
  return letters[Math.floor(26 * Math.random())];
}

const isPalindrome = function(word) {
  let l = 0;
  let r = word.length-1;
  while (l < r) {
    if (word[l] !== word[r]) {
      return false;
    }
    l++;
    r--;
  }
  return true;
}

export { letters, wordList, getDirectionString, getDirectionArray, validateWord, getRandomLetter, isPalindrome };