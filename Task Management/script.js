
// Task Manager JS
(function(){
      const STORAGE_KEY = 'tm_tasks_v1';
      let tasks = []; // {id, title, priority, due, done, order}
      const el = id => document.getElementById(id);
      const taskList = el('taskList');
      const emptyState = el('emptyState');
      const countText = el('countText');

      // init
      function load(){
        try{
          const raw = localStorage.getItem(STORAGE_KEY);
          tasks = raw ? JSON.parse(raw) : [];
        }catch(e){
          console.warn('Load failed', e);
          tasks = [];
        }
        // ensure order exists
        tasks.forEach((t,i)=>{ if (t.order===undefined) t.order = i });
        render();
      }
      function save(){
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        renderCount();
      }

      // util
      const uid = () => 't_' + Math.random().toString(36).slice(2,9);
      function formatDate(d){ if(!d) return ''; const dt = new Date(d); if (isNaN(dt)) return ''; return dt.toLocaleDateString(); }

      // add / edit
      function addTask(obj){
        const task = {
          id: uid(), title: obj.title.trim(), priority: obj.priority || 'medium',
          due: obj.due || '', done:false, order: tasks.length ? Math.max(...tasks.map(t=>t.order))+1 : 0
        };
        tasks.push(task);
        save();
      }
      function updateTask(id, updates){
        const t = tasks.find(x=>x.id===id);
        if(!t) return;
        Object.assign(t, updates);
        save();
      }
      function deleteTask(id){
        tasks = tasks.filter(t=>t.id!==id);
        save();
      }

      // render
      function render(){
        // apply sorts/filters/search
        const filter = document.querySelector('[data-filter].active')?.dataset.filter || 'all';
        const search = el('search').value.trim().toLowerCase();
        const sort = el('sortSelect').value;

        let visible = tasks.slice();

        // filtering
        if(filter==='active') visible = visible.filter(t=>!t.done);
        if(filter==='completed') visible = visible.filter(t=>t.done);

        // searching
        if(search){
          visible = visible.filter(t => (t.title||'').toLowerCase().includes(search));
        }

        // sorting
        if(sort === 'priority'){
          const pval = p => p==='high'?0:p==='medium'?1:2;
          visible.sort((a,b)=> pval(a.priority) - pval(b.priority) || a.order - b.order);
        } else if(sort === 'duedate'){
          visible.sort((a,b)=>{
            if(!a.due && !b.due) return a.order - b.order;
            if(!a.due) return 1;
            if(!b.due) return -1;
            return new Date(a.due) - new Date(b.due);
          });
        } else {
          visible.sort((a,b)=> a.order - b.order);
        }

        // render dom
        taskList.innerHTML = '';
        if(visible.length === 0){
          emptyState.style.display = 'block';
        } else {
          emptyState.style.display = 'none';
        }

        visible.forEach(t => {
          const row = document.createElement('div');
          row.className = 'task';
          row.draggable = true;
          row.dataset.id = t.id;

          // checkbox
          const cb = document.createElement('div');
          cb.className = 'checkbox' + (t.done ? ' checked' : '');
          cb.title = t.done ? 'Mark as not done' : 'Mark as done';
          cb.innerHTML = t.done ? '✓' : '';
          cb.addEventListener('click', () => updateTask(t.id, {done: !t.done}));
          row.appendChild(cb);

          // title + meta
          const title = document.createElement('div');
          title.className = 'title';
          const main = document.createElement('div');
          const strong = document.createElement('strong');
          strong.textContent = t.title;
          if(t.done) strong.style.textDecoration = 'line-through';
          main.appendChild(strong);
          title.appendChild(main);
          const meta = document.createElement('div');
          meta.className = 'meta';
          const pri = document.createElement('span');
          pri.className = 'pill ' + (t.priority==='high' ? 'p-high' : (t.priority==='low' ? 'p-low' : 'p-med'));
          pri.textContent = t.priority;
          meta.appendChild(pri);
          if(t.due){
            const d = document.createElement('span');
            d.className = 'muted';
            d.textContent = 'Due: ' + formatDate(t.due);
            meta.appendChild(d);
          }
          title.appendChild(meta);
          row.appendChild(title);

          // actions
          const actions = document.createElement('div');
          actions.className = 'actions';
          const edit = document.createElement('button');
          edit.className = 'btn small';
          edit.textContent = 'Edit';
          edit.addEventListener('click', ()=> startEdit(t.id));
          const del = document.createElement('button');
          del.className = 'btn small secondary';
          del.textContent = 'Delete';
          del.addEventListener('click', ()=> {
            if(confirm('Delete task "'+ t.title +'"?')) deleteTask(t.id);
          });
          actions.appendChild(edit);
          actions.appendChild(del);
          row.appendChild(actions);

          // drag handlers
          row.addEventListener('dragstart', dragStart);
          row.addEventListener('dragover', dragOver);
          row.addEventListener('dragend', dragEnd);
          row.addEventListener('drop', dropHandler);

          taskList.appendChild(row);
        });
        renderCount();
      }

      function renderCount(){
        const total = tasks.length;
        const done = tasks.filter(t=>t.done).length;
        countText.textContent = `${total} task${total!==1 ? 's' : ''} — ${done} done`;
      }

      // edit flow
      function startEdit(id){
        const t = tasks.find(x=>x.id===id); if(!t) return;
        el('taskTitle').value = t.title;
        el('taskPriority').value = t.priority;
        el('taskDue').value = t.due || '';
        el('editId').value = id;
        el('addBtn').textContent = 'Save';
        el('taskTitle').focus();
      }

      function resetForm(){
        el('taskTitle').value = '';
        el('taskPriority').value = 'medium';
        el('taskDue').value = '';
        el('editId').value = '';
        el('addBtn').textContent = 'Add Task';
      }

      // form submit
      el('taskForm').addEventListener('submit', (e)=>{
        e.preventDefault();
        const title = el('taskTitle').value.trim();
        if(!title) return alert('Please add a task title');
        const priority = el('taskPriority').value;
        const due = el('taskDue').value;
        const editId = el('editId').value;

        if(editId){
          updateTask(editId, {title, priority, due});
          resetForm();
        } else {
          addTask({title, priority, due});
          resetForm();
        }
      });

      // quick shortcuts
      el('search').addEventListener('input', render);
      el('sortSelect').addEventListener('change', render);

      // filter buttons
      document.querySelectorAll('[data-filter]').forEach(btn=>{
        btn.addEventListener('click', () => {
          document.querySelectorAll('[data-filter]').forEach(b=>b.classList.remove('active'));
          btn.classList.add('active');
          render();
        });
      });
      // default active filter
      document.querySelector('[data-filter="all"]').classList.add('active');

      // clear all
      el('clearAll').addEventListener('click', ()=>{
        if(!tasks.length) return alert('No tasks to clear');
        if(confirm('Clear ALL tasks? This cannot be undone.')) {
          tasks = []; save();
          resetForm();
        }
      });

      // export/import
      el('exportBtn').addEventListener('click', ()=>{
        const data = JSON.stringify(tasks, null, 2);
        const blob = new Blob([data], {type:'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'tasks.json'; a.click();
        URL.revokeObjectURL(url);
      });

      el('importFile').addEventListener('change', (ev)=>{
        const f = ev.target.files[0];
        if(!f) return;
        const reader = new FileReader();
        reader.onload = (e)=>{
          try{
            const imported = JSON.parse(e.target.result);
            if(!Array.isArray(imported)) throw new Error('Invalid file');
            // assign new ids if needed
            const normalized = imported.map((t,i)=>({
              id: t.id || uid(),
              title: t.title || 'Untitled',
              priority: t.priority || 'medium',
              due: t.due || '',
              done: !!t.done,
              order: t.order === undefined ? (tasks.length + i) : t.order
            }));
            tasks = tasks.concat(normalized);
            save();
            alert('Imported ' + normalized.length + ' tasks.');
          }catch(err){
            alert('Import failed: ' + err.message);
          }
        };
        reader.readAsText(f);
        ev.target.value = '';
      });

      // drag and drop reordering
      let dragSrc = null;
      function dragStart(e){
        dragSrc = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      }
      function dragOver(e){
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const over = this;
        if(!dragSrc || over === dragSrc) return;
        // visual reorder: insert before/after based on mouse
        const rect = over.getBoundingClientRect();
        const halfway = rect.top + rect.height/2;
        if(e.clientY < halfway) over.parentNode.insertBefore(dragSrc, over);
        else over.parentNode.insertBefore(dragSrc, over.nextSibling);
      }
      function dragEnd(){
        this.classList.remove('dragging');
        // persist new order from DOM
        const orderEls = Array.from(taskList.children);
        orderEls.forEach((elRow, idx) => {
          const id = elRow.dataset.id;
          const t = tasks.find(x=>x.id===id);
          if(t) t.order = idx;
        });
        save();
        render();
      }
      function dropHandler(e){
        e.stopPropagation();
        return false;
      }

      // initialize
      load();

      // expose for debugging (optional)
      window._tm = {
        get tasks(){ return tasks },
        addTask: (o)=>{ addTask(o); },
        save, load
      };

    })();
  