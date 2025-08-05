# WordSearch

A word search implemented in JS. Here are some rules that the puzzle generation follows:
- Each word has exactly **one** occurrence in the puzzle
- Words can appear in all 8 orientations
- Ratio of "spaces used by words" to "total spaces" is ~0.75
- Website is fixed to created `20x20` grids (~80 words), however, the generation algorithm can produce `70x70` puzzles with ~900 words in under 60 seconds (when testing locally)

## Wordlist

The wordlist that I am using was created by combining [this](https://www.mit.edu/~ecprice/wordlist.10000) wordlist along with other lists that I found online.  