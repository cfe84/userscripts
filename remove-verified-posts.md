Drag and drop the link below to your bookmarks toolbar.

<a id="bookmarklet" href="/">💙</a>

When you are on twitter and click on it, you'll stop seeing stuff posted by verified ~~twitter~~ X accounts, and feel much more relaxed.

<script>
  const link = document.getElementById("bookmarklet");
  link.href = "(javascript:(function() { function removeVerified() { const posts = [...document.querySelectorAll('.r-1adg3ll')]; const verified = posts.filter(post => post.querySelector(`[data-testid='icon-verified']`)); for(let post of verified) { post.style.display = 'none'; } } setInterval(removeVerified, 500); })();)";
</script>
