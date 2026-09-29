// Blog engagement: likes + comments + Google auth backed by Supabase
(function () {
    const SUPABASE_URL = 'https://pmkogleiuckixyhgacni.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_SMPHQpt7Rts_yBe2mxLp-w_Nw5uidMm';

    const engagement = document.querySelector('.engagement');
    if (!engagement) return;

    const postId = engagement.getAttribute('data-post-id');

    // REST headers (used for likes + reading/writing comments)
    const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json'
    };

    // Supabase client (used only for Google auth)
    let sb = null;
    if (window.supabase && window.supabase.createClient) {
        sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }

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

    // ---------- GOOGLE AUTH ----------
    const googleBtn = document.getElementById('googleSignIn');
    const authBar = document.getElementById('authBar');
    const signedInAs = document.getElementById('signedInAs');
    const guestFields = document.getElementById('guestFields');
    const nameInput = document.getElementById('cName');
    const emailInput = document.getElementById('cEmail');

    let currentUser = null;

    async function checkSession() {
        if (!sb) return;
        try {
            const { data } = await sb.auth.getSession();
            if (data && data.session && data.session.user) {
                setSignedIn(data.session.user);
            }
        } catch (e) {}
    }

    function setSignedIn(user) {
        currentUser = user;
        const displayName = user.user_metadata.full_name || user.user_metadata.name || user.email;
        const email = user.email;
        if (authBar) authBar.style.display = 'none';
        if (guestFields) guestFields.style.display = 'none';
        if (signedInAs) {
            signedInAs.style.display = 'flex';
            signedInAs.innerHTML =
                '<span>Commenting as <strong>' + escapeHtml(displayName) + '</strong> (' + escapeHtml(email) + ')</span>' +
                '<button type="button" id="signOutBtn" class="signout-link">Sign out</button>';
            const signOut = document.getElementById('signOutBtn');
            if (signOut) signOut.addEventListener('click', doSignOut);
        }
        // Prefill hidden guest inputs so submit works uniformly
        if (nameInput) nameInput.value = displayName;
        if (emailInput) emailInput.value = email;
    }

    async function doSignOut() {
        if (sb) await sb.auth.signOut();
        currentUser = null;
        if (authBar) authBar.style.display = 'flex';
        if (guestFields) guestFields.style.display = 'grid';
        if (signedInAs) { signedInAs.style.display = 'none'; signedInAs.innerHTML = ''; }
        if (nameInput) nameInput.value = '';
        if (emailInput) emailInput.value = '';
    }

    if (googleBtn && sb) {
        googleBtn.addEventListener('click', async () => {
            await sb.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.href }
            });
        });
        checkSession();
    } else if (googleBtn && !sb) {
        // Supabase library failed to load — hide Google option, keep guest form
        if (authBar) authBar.style.display = 'none';
    }

    // ---------- COMMENTS ----------
    const form = document.getElementById('commentForm');
    const list = document.getElementById('commentsList');
    const empty = document.getElementById('commentsEmpty');
    const countEl = document.getElementById('commentCount');
    const submitBtn = document.getElementById('cSubmit');

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
        return localStorage.getItem('vote_' + postId + '_' + commentId); // 'like' | 'dislike' | null
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
        const existing = localStorage.getItem(key);
        if (existing) return; // one vote per browser per comment

        const countSpan = btn.querySelector('.cvote-count');
        const current = parseInt(countSpan.textContent, 10) || 0;
        const next = current + 1;
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

    async function submitComment(e) {
        e.preventDefault();
        const message = document.getElementById('cMessage');

        let valid = true;
        const fieldsToCheck = currentUser ? [message] : [nameInput, emailInput, message];
        fieldsToCheck.forEach(f => {
            if (!f.value.trim()) { f.classList.add('error'); valid = false; }
            else { f.classList.remove('error'); }
        });
        if (!valid) return;

        submitBtn.textContent = 'Posting…';
        submitBtn.disabled = true;

        const payload = {
            post_id: postId,
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            message: message.value.trim()
        };

        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/comments`, {
                method: 'POST',
                headers: Object.assign({ 'Prefer': 'return=minimal' }, headers),
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                if (window.emailjs) {
                    try {
                        emailjs.send('service_h3z1qjh', 'template_3d82uq7', {
                            name: payload.name,
                            email: payload.email,
                            subject: 'New blog comment on ' + postId,
                            message: payload.message
                        });
                    } catch (err) {}
                }
                message.value = '';
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
