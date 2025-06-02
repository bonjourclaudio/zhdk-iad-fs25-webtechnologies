async function readExJson() {
  try {
    const response = await fetch('exercises.json');
    const exercises = await response.json();
    const list = document.getElementById('exerciseList');

    exercises.forEach(ex => {

      const parts = ex.split('_');
      const day = parts[1];
      const month = parts[2];
      const year = parts[3];
      const formattedDate = `${day}.${month}.${year}`;
      const formattedName = `Day ${day} [${formattedDate}] - ${parts[4].toUpperCase()}`;

      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `${ex}`;
      a.textContent = formattedName;
      a.className = 'exercise-link';
      li.appendChild(a);
      list.appendChild(li);
    });
  } catch (err) {
    console.error('Error reading exercises.json:', err);
  }
}

readExJson();