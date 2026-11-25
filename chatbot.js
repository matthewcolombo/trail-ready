const chatForm = document.querySelector('#chat-form');
const chatQuestion = document.querySelector('#chat-question');
const chatSend = document.querySelector('#chat-send');
const chatClear = document.querySelector('#chat-clear');
const chatMessages = document.querySelector('#chat-messages');
const chatStatus = document.querySelector('#chat-status');
const chatEndpoint = chatForm.dataset.endpoint.trim();
let activeRequest = null;

function addChatMessage(speaker, message) {
  const paragraph = document.createElement('p');
  const label = document.createElement('strong');
  label.textContent = speaker + ': ';
  paragraph.append(label, document.createTextNode(message));
  chatMessages.append(paragraph);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

if (chatEndpoint) {
  chatQuestion.disabled = false;
  chatSend.disabled = false;
  chatStatus.textContent = 'Ready for your packing question.';
}

chatForm.addEventListener('submit', async function (event) {
  event.preventDefault();
  const question = chatQuestion.value.trim();
  if (!chatEndpoint || !question || activeRequest) return;
  addChatMessage('You', question);
  chatQuestion.value = '';
  chatSend.disabled = true;
  chatStatus.textContent = 'Preparing a reply…';
  const request = new AbortController();
  activeRequest = request;
  const timeout = setTimeout(() => request.abort(), 30000);
  try {
    const response = await fetch(chatEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: question }),
      signal: request.signal
    });
    if (!response.ok) throw new Error('The assistant could not answer. Please try again later.');
    const result = await response.json();
    if (typeof result.reply !== 'string' || !result.reply.trim()) throw new Error('No reply was returned. Please try another question.');
    if (activeRequest !== request) return;
    addChatMessage('Assistant', result.reply);
    chatStatus.textContent = 'Reply received. You can ask another question.';
  } catch (error) {
    if (activeRequest === request) {
      chatStatus.textContent = error.name === 'AbortError'
        ? 'The request timed out. Please try again.'
        : 'The assistant is unavailable. Please try again later.';
    }
  } finally {
    clearTimeout(timeout);
    if (activeRequest === request) {
      activeRequest = null;
      chatSend.disabled = false;
    }
  }
});

chatClear.addEventListener('click', function () {
  if (activeRequest) activeRequest.abort();
  activeRequest = null;
  chatMessages.replaceChildren();
  chatQuestion.value = '';
  chatSend.disabled = !chatEndpoint;
  chatStatus.textContent = chatEndpoint ? 'Conversation cleared.' : 'The assistant is not connected yet.';
});
