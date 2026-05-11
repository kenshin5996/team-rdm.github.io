/* =========================================
   💬 TEAM RDM LIVE CHAT
========================================= */

async function sendMessage(){

  const name = ($('chatName').value || '').trim();
  const text = ($('chatInput').value || '').trim();

  if(!name) return alert('Ajoute un pseudo');

  if(!text) return alert('Écris un message');

  if(text.length > 250){
    return alert('Message trop long');
  }

  if(!firebaseReady || !dbTools || !dbRef){
    return alert('Firebase non connecté');
  }

  try{

    await dbTools.addDoc(
      dbTools.collection(dbRef,'chat'),
      {
        name,
        text,
        createdAt: dbTools.serverTimestamp()
      }
    );

    $('chatInput').value='';

  }catch(err){

    console.error(err);

    alert('Impossible d’envoyer le message');
  }
}

function initChat(){

  if(!firebaseReady || !dbTools || !dbRef) return;

  dbTools.onSnapshot(
    dbTools.query(
      dbTools.collection(dbRef,'chat'),
      dbTools.orderBy('createdAt','asc')
    ),

    snap => {

      const box = $('chatMessages');

      if(!box) return;

      box.innerHTML='';

      snap.forEach(doc => {

        const msg = doc.data();

        const div = document.createElement('div');

        div.className = 'message';

        div.innerHTML = `
          <strong>${clean(msg.name)}</strong><br>
          ${clean(msg.text)}
        `;

        box.appendChild(div);
      });

      box.scrollTop = box.scrollHeight;
    }
  );
}

$('chatInput')?.addEventListener('keydown', e => {

  if(e.key === 'Enter'){
    sendMessage();
  }
});
