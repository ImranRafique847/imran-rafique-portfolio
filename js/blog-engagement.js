// Blog engagement: likes + comments (Google-verified) backed by Supabase
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

    let sb = null;
    if (window.supabase && window.supabase.createClient) {
        sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }

    const pendingKey = 'pending_comment_' + postId;

    // ---------- LIKES ----------
    const likeBtn = document.getElementById('likeBtn');
    const likeCount = document.getElementById('likeCount');
    const likedKey = 'liked_' + postId;

    async function loadLikes() {
        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/likes?post_id=eq.${postId}&select=count`, { headers });
            const data = await res.json();
            if (data && data.length) likeCount.textContent = data[0].count;
        } catch (e) {}
    }

    async function toggleLike() {
        if (localStorage.getItem(likedKey)) return;
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
        } catch (e) {}
    }

    if (likeBtn) {
        if (localStorage.getItem(likedKey)) likeBtn.classList.add('liked');
        loadLikes();
        likeBtn.addEventListener('click', toggleLike);
    }

    // ---------- COMMENTS ----------
    const form = document.getElementById('commentForm');
    const list = document.getElementById('commentsList');
    const empty = document.getElementById('commentsEmpty');
    const countEl = document.getElementById('commentCount');
    const submitBtn = document.getElementById('cSubmit');
    const messageInput = document.getElementById('cMessage');
    const signedInAs = document.getElementById('signedInAs');

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str == null ? '' : str;
        return div.innerHTML;
    }

    function formatDate(iso) {
        const d = new Date(iso);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function voteState(commentId) {
        return localStorage.getItem('vote_' + postId + '_' + commentId);
    }

    function renderComment(c) {
        const initial = (c.name || '?').trim().charAt(0).toUpperCase();
        const div = document.createElement('div');
        div.className = 'comment-item';
        const myVote = voteState(c.id);
        div.innerHTML =
            '<div class="comment-head">' +
                '<div class="comment-avatar">' + escapeHtml(initial) + '</div>' +
                '<span class="comment-author">' + escapeHtml(c.name) + '</span>' +
                '<span class="comment-date">' + formatDate(c.created_at) + '</span>' +
            '</div>' +
            '<div class="comment-body">' + escapeHtml(c.message) + '</div>' +
            '<div class="comment-actions">' +
                '<button class="cvote clike' + (myVote === 'like' ? ' active' : '') + '" data-id="' + c.id + '" data-type="like" aria-label="Like comment">' +
                    '<span>👍</span> <span class="cvote-count">' + (c.likes || 0) + '</span>' +
                '</button>' +
                '<button class="cvote cdislike' + (myVote === 'dislike' ? ' active' : '') + '" data-id="' + c.id + '" data-type="dislike" aria-label="Dislike comment">' +
                    '<span>👎</span> <span class="cvote-count">' + (c.dislikes || 0) + '</span>' +
                '</button>' +
            '</div>';
        return div;
    }

    async function voteComment(commentId, type, btn) {
        const key = 'vote_' + postId + '_' + commentId;
        if (localStorage.getItem(key)) return;
        const countSpan = btn.querySelector('.cvote-count');
        const next = (parseInt(countSpan.textContent, 10) || 0) + 1;
        countSpan.textContent = next;
        btn.classList.add('active');
        localStorage.setItem(key, type);
        const column = type === 'like' ? 'likes' : 'dislikes';
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/comments?id=eq.${commentId}`, {
                method: 'PATCH',
                headers: Object.assign({ 'Prefer': 'return=minimal' }, headers),
                body: JSON.stringify({ [column]: next })
            });
        } catch (e) {}
    }

    function bindVoteButtons() {
        list.querySelectorAll('.cvote').forEach(btn => {
            btn.addEventListener('click', () => {
                voteComment(btn.getAttribute('data-id'), btn.getAttribute('data-type'), btn);
            });
        });
    }

    async function loadComments() {
        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/comments?post_id=eq.${postId}&select=id,name,message,created_at,likes,dislikes&order=created_at.desc`, { headers });
            const data = await res.json();
            list.querySelectorAll('.comment-item').forEach(el => el.remove());
            if (data && data.length) {
                if (empty) empty.style.display = 'none';
                countEl.textContent = data.length;
                data.forEach(c => list.appendChild(renderComment(c)));
                bindVoteButtons();
            } else {
                countEl.textContent = '0';
                if (empty) empty.style.display = 'block';
            }
        } catch (e) {}
    }

    async function postComment(name, email, message) {
        const payload = { post_id: postId, name: name, email: email, message: message };
        const res = await fetch(`${SUPABASE_URL}/rest/v1/comments`, {
            method: 'POST',
            headers: Object.assign({ 'Prefer': 'return=minimal' }, headers),
            body: JSON.stringify(payload)
        });
        if (res.ok && window.emailjs) {
            try {
                emailjs.send('service_h3z1qjh', 'template_3d82uq7', {
                    name: name, email: email,
                    subject: 'New blog comment on ' + postId,
                    message: message
                });
            } catch (e) {}
        }
        return res.ok;
    }

    // On form submit: save the comment text, then trigger Google sign-in
    async function handleSubmit(e) {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (!message) { messageInput.classList.add('error'); return; }

        if (!sb) {
            alert('Sign-in is unavailable right now. Please try again later.');
            return;
        }

        // Save pending comment so we can post it after returning from Google
        localStorage.setItem(pendingKey, message);

        submitBtn.textContent = 'Redirecting to Google…';
        submitBtn.disabled = true;

        await sb.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.href }
        });
    }

    // After returning from Google: if a pending comment exists and user is signed in, post it
    async function resumeAfterAuth() {
        if (!sb) return;
        let user = null;
        try {
            const { data } = await sb.auth.getSession();
            if (data && data.session && data.session.user) user = data.session.user;
        } catch (e) {}

        if (!user) return;

        const pending = localStorage.getItem(pendingKey);
        const displayName = user.user_metadata.full_name || user.user_metadata.name || user.email;

        if (pending) {
            const ok = await postComment(displayName, user.email, pending);
            localStorage.removeItem(pendingKey);
            if (ok) {
                messageInput.value = '';
                loadComments();
            }
            // Sign out so the next commenter isn't tied to this session
            try { await sb.auth.signOut(); } catch (e) {}
            // Clean the URL hash left by OAuth
            history.replaceState(null, '', window.location.pathname);
        } else {
            // Signed in but no pending comment — sign out silently
            try { await sb.auth.signOut(); } catch (e) {}
            history.replaceState(null, '', window.location.pathname);
        }
    }

    if (form) {
        loadComments();
        form.addEventListener('submit', handleSubmit);
        messageInput.addEventListener('input', () => messageInput.classList.remove('error'));
        // If we just came back from Google OAuth, finish posting
        if (window.location.hash.indexOf('access_token') !== -1 || localStorage.getItem(pendingKey)) {
            resumeAfterAuth();
        }
    }
})();
