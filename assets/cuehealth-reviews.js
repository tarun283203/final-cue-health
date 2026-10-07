(() => {
  if (customElements.get('cuehealth-reviews')) return;
  customElements.define('cuehealth-reviews', class extends HTMLElement {
    connectedCallback() {
      if (this.abort) return;
      this.abort = new AbortController();
      const { signal } = this.abort;
      this.cards = [...this.querySelectorAll('[data-cue-card]')];
      this.more = this.querySelector('[data-cue-more]');
      this.status = this.querySelector('[data-cue-status]');
      this.dialog = this.querySelector('[data-cue-dialog]');
      this.content = this.querySelector('[data-cue-dialog-content]');
      this.pageSize = Number(this.dataset.pageSize) || 8;
      this.visible = this.dataset.loadMore === 'true' ? this.pageSize : this.cards.length;
      this.update();
      this.more?.addEventListener('click', () => {
        const firstNew = this.cards[this.visible];
        this.visible += this.pageSize;
        this.update();
        firstNew?.focus({ preventScroll: true });
      }, { signal });
      this.addEventListener('click', event => {
        const trigger = event.target.closest('[data-cue-open]');
        if (!trigger || !this.contains(trigger)) return;
        const card = this.cards.find(item => '#' + item.id === trigger.getAttribute('href'));
        if (!card) return;
        event.preventDefault();
        if (this.dataset.lightbox === 'true' && this.dialog?.showModal) {
          this.opener = trigger;
          const clone = card.cloneNode(true);
          clone.hidden = false;
          clone.removeAttribute('id');
          clone.removeAttribute('data-cue-card');
          const photoLink = clone.querySelector('[data-cue-open]');
          if (photoLink) photoLink.replaceWith(photoLink.querySelector('img'));
          this.content.replaceChildren(clone);
          this.dialog.showModal();
        } else {
          this.visible = Math.max(this.visible, this.cards.indexOf(card) + 1);
          this.update();
          card.scrollIntoView({ block: 'nearest', inline: 'center' });
          card.focus({ preventScroll: true });
        }
      }, { signal });
      this.querySelector('[data-cue-close]')?.addEventListener('click', () => this.dialog.close(), { signal });
      this.dialog?.addEventListener('click', event => {
        if (event.target !== this.dialog) return;
        const box = this.dialog.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) this.dialog.close();
      }, { signal });
      this.dialog?.addEventListener('close', () => this.opener?.focus(), { signal });
    }
    update() {
      this.cards.forEach((card, index) => { card.hidden = index >= this.visible; });
      if (this.more) this.more.hidden = this.visible >= this.cards.length;
      if (this.status) this.status.textContent = `Showing ${Math.min(this.visible, this.cards.length)} of ${this.cards.length} reviews`;
    }
    disconnectedCallback() {
      this.dialog?.close();
      this.abort?.abort();
      this.abort = null;
    }
  });
})();
