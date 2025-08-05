import { run } from './puzzleScripts/main.js';

let wordsRemaining = null;
let wordList = null;
let foundWords = null;
let isMouseDown = false;
let startCell = null;
let selectedCells = [];

document.addEventListener('DOMContentLoaded', () => {
  const size = 20;
  const { used: words, grid } = run(size, false);
  const wordsToFind = document.getElementById('words-to-find');
  const gridContainer = document.getElementById('grid');
  gridContainer.style.setProperty('--rows', size);
  gridContainer.style.setProperty('--cols', size);
  words.sort((a,b) => a.localeCompare(b));
  for (const word of words) {
    const item = document.createElement('li');
    item.textContent = word.toUpperCase();
    wordsToFind.appendChild(item);
  }
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.row = i;
      cell.dataset.col = j;
      cell.textContent = grid[i][j].toUpperCase();
      gridContainer.appendChild(cell);
      installListeners(cell);
    }
  }
  foundWords = new Set();
  selectedCells = [];
  startCell = null;
  isMouseDown = false;
  wordList = words;
  wordsRemaining = document.querySelector('.word-list h5');
  wordsRemaining.style.display = 'inherit';
  wordsRemaining.textContent = `Remaining: ${wordList.length - foundWords.size}`;
  document.querySelector('.word-list h2').style.display = 'inherit';
});

function installListeners(cell) {
  cell.addEventListener("mousedown", () => {
    clearSelection();
    isMouseDown = true;
    startCell = cell;
    highlightPath(cell);
  });
  cell.addEventListener("mouseenter", () => {
    if (isMouseDown && startCell) {
      highlightPath(cell);
    }
  });
  cell.addEventListener("mouseup", () => {
    if (isMouseDown) {
      isMouseDown = false;
      processSelection();
    }
  });
  cell.addEventListener("dragstart", e => e.preventDefault());
}

document.addEventListener("mouseup", () => {
  if (isMouseDown) {
    isMouseDown = false;
    processSelection();
  }
});

function clearSelection() {
  selectedCells.forEach(c => c.classList.remove("selected"));
  selectedCells = [];
}

function highlightPath(endCell) {
  clearSelection();
  if (!startCell) return;
  const r1 = +startCell.dataset.row;
  const c1 = +startCell.dataset.col;
  const r2 = +endCell.dataset.row;
  const c2 = +endCell.dataset.col;
  const dr = r2-r1;
  const dc = c2-c1;
  const steps = Math.max(Math.abs(dr), Math.abs(dc));
  if (steps === 0) {
    startCell.classList.add("selected");
    selectedCells = [startCell];
    return;
  }
  const stepR = dr / steps;
  const stepC = dc / steps;
  if (!Number.isInteger(stepR) || !Number.isInteger(stepC)) return;
  for (let i = 0; i <= steps; i++) {
    const row = r1 + i * stepR;
    const col = c1 + i * stepC;
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    if (cell) {
      cell.classList.add("selected");
      selectedCells.push(cell);
    }
  }
}

function processSelection() {
  if (selectedCells.length === 0) return;
  const word = selectedCells.map(c => c.textContent).join("").toLowerCase();
  const matched = wordList.includes(word) ? word : null;
  if (matched) {
    if (foundWords.has(matched)) {
      showMessage(`⚠️ "${matched.toUpperCase()}" already found`, "error");
    } else {
      showMessage(`✅ Found: ${matched.toUpperCase()}`, "success");
      foundWords.add(matched);
      const rem = wordList.length-foundWords.size;
      wordsRemaining.textContent = `Remaining: ${rem}`;
      if (rem === 0) {
        processWin();
      }
      animateFoundWord([...selectedCells]);
      const li = [...document.querySelectorAll(".word-list li")].find(el => el.textContent.trim().toLowerCase() === matched);
      if (li) {
        li.classList.add("found");
      }
    }
  } else {
    showMessage(`❌ "${word.toUpperCase()}" is not in the list`, "error");
  }
  clearSelection();
}

function showMessage(msg, type) {
  const box = document.getElementById("result");
  box.textContent = msg;
  box.className = `result-box ${type}`;
  box.style.display = "block";
  setTimeout(() => {
    box.style.display = "none";
  }, 2000);
}

function animateFoundWord(cells) {
  cells.forEach((cell, i) => {
    cell.classList.add("found");
    cell.style.animation = `bounce 0.4s ${i*0.05}s ease-in-out`;
  });
}

function processWin() {
  setTimeout(() => {
    const elm = document.createElement('div');
    elm.style.marginTop = '-5rem';
    elm.style.paddingTop = '.5rem'
    elm.style.fontSize = '1.2rem';
    elm.style.fontWeight = 'bold';
    elm.innerHTML = `You win! Here's your <a href="https://youtu.be/dQw4w9WgXcQ" target="_blank" style="color:red;text-decoration:none">prize</a>!`;
    document.querySelector('.container').after(elm);
  }, 2500);
}