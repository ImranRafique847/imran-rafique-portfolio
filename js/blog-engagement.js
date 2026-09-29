// Blog engagement: likes + comments backed by Supabase
(function () {
    const SUPABASE_URL = 'https://pmkogleiuckixyhgacni.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_SMPHQpt7Rts_yBe2mxLp-w_Nw5uidMm';

    const engagement = document.querySelector('.engagement');
    if (!engagement) return;

    const postId = engagement.getAttribute('data-post-id');
    const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json'
    };

    // ---------- LIKES ----------
    const likeBtn = document.getElementById('likeBtn');
    const likeCount = document.getElementById('likeCount');
    const likedKey = 'liked_' + postId;

    function markLikedState() {
        if (localStorage.getItem(likedKey)) {
            likeBtn.classList.add('liked');
        }
    }

    async function loadLikes() {
        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/likes?post_id=eq.${postId}&select=count`, { headers });
            const data = await res.json();
            if (data && data.length) likeCount.textContent = data[0].count;
        } catch (e) { /* silent */ }
    }

    async function toggleLike() {
        if (localStorage.getItem(likedKey)) return; // one like per browser
        const current = parseInt(likeCount.textContent, 10) || 0;
        const next = current + 1;
        likeCount.textContent = next;
        likeBtn.classList.add('liked');
        localStorage.setItem(likedKey, '1');
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/likes?post_id=eq.${postId}`, {
                method: 'PATCH',
                headers: Object.assign({ 'Prefer': 'return=minimal' }, headers),
                body: JSON.stringify({ count: next })
            });
        } catch (e) { /* silent */ }
    }

    if (likeBtn) {
        markLikedState();
        loadLikes();
        likeBtn.addEventListener('click', toggleLike);
    }

    // ---------- COMMENTS ----------
    const form = document.getElementById('commentForm');
    const list = document.getElementById('commentsList');
    const empty = document.getElementById('commentsEmpty');
    const countEl = document.getElementById('commentCount');
    const submitBtn = document.getElementById('cSubmit');

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function formatDate(iso) {
        const d = new Date(iso);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function renderComment(c) {
        const initial = (c.name || '?').trim().charAt(0).toUpperCase();
        const div = document.createElement('div');
        div.className = 'comment-item';
        div.innerHTML =
            '<div class="comment-head">' +
                '<div class="comment-avatar">' + escapeHtml(initial) + '</div>' +
                '<span class="comment-author">' + escapeHtml(c.name) + '</span>' +
                '<span class="comment-date">' + formatDate(c.created_at) + '</span>' +
            '</div>' +
            '<div class="comment-body">' + escapeHtml(c.message) + '</div>';
        return div;
    }

    async function loadComments() {
        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/comments?post_id=eq.${postId}&select=name,message,created_at&order=created_at.desc`, { headers });
            const data = await res.json();
            if (data && data.length) {
                if (empty) empty.style.display = 'none';
                countEl.textContent = data.length;
                list.querySelectorAll('.comment-item').forEach(el => el.remove());
                data.forEach(c => list.appendChild(renderComment(c)));
            } else {
                countEl.textContent = '0';
            }
        } catch (e) { /* silent */ }
    }

    async function submitComment(e) {
        e.preventDefault();
        const name = document.getElementById('cName');
        const email = document.getElementById('cEmail');
        const message = document.getElementById('cMessage');

        let valid = true;
        [name, email, message].forEach(f => {
            if (!f.value.trim()) { f.classList.add('error'); valid = false; }
            else { f.classList.remove('error'); }
        });
        if (!valid) return;

        submitBtn.textContent = 'Posting…';
        submitBtn.disabled = true;

        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/comments`, {
                method: 'POST',
                headers: Object.assign({ 'Prefer': 'return=minimal' }, headers),
                body: JSON.stringify({
                    post_id: postId,
                    name: name.value.trim(),
                    email: email.value.trim(),
                    message: message.value.trim()
                })
            });

            if (res.ok) {
                // Notify owner via EmailJS if available
                if (window.emailjs) {
                    try {
                        emailjs.send('service_h3z1qjh', 'template_3d82uq7', {
                            name: name.value.trim(),
                            email: email.value.trim(),
                            subject: 'New blog comment on ' + postId,
                            message: message.value.trim()
                        });
                    } catch (err) { /* silent */ }
                }
                form.reset();
                submitBtn.textContent = 'Post Comment';
                submitBtn.disabled = false;
                loadComments();
            } else {
                throw new Error('failed');
            }
        } catch (err) {
            submitBtn.textContent = 'Post Comment';
            submitBtn.disabled = false;
            alert('Could not post comment. Please try again.');
        }
    }

    if (form) {
        loadComments();
        form.addEventListener('submit', submitComment);
        form.querySelectorAll('input, textarea').forEach(f => {
            f.addEventListener('input', () => f.classList.remove('error'));
        });
    }
})();
