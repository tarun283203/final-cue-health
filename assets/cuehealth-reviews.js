function resizeImage(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

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

      this.writeToggle = this.querySelector('[data-cue-write-toggle]');
      this.writeForm = this.querySelector('[data-cue-write-form]');
      this.writeStatus = this.querySelector('[data-cue-write-status]');
      this.writeToggle?.addEventListener('click', () => {
        this.writeForm.hidden = !this.writeForm.hidden;
        if (!this.writeForm.hidden) this.writeForm.querySelector('input,select,textarea')?.focus();
      }, { signal });
      this.writeForm?.addEventListener('submit', event => this.submitReview(event), { signal });
    }
    async submitReview(event) {
      event.preventDefault();
      const form = event.target;
      const submitUrl = form.dataset.submitUrl;
      const productId = form.dataset.productId;
      const submitBtn = form.querySelector('.cue-reviews-write__submit');
      const status = this.writeStatus;
      submitBtn.disabled = true;
      status.textContent = 'Submitting…';
      try {
        const fileInput = form.querySelector('input[type="file"]');
        const file = fileInput?.files?.[0];
        let imageBase64 = '', imageFilename = '', imageMimeType = '';
        if (file) {
          const resized = await resizeImage(file, 1000, 0.8);
          imageBase64 = resized.base64;
          imageFilename = file.name.replace(/[^\w.\-]/g, '_');
          imageMimeType = resized.mimeType;
        }
        const data = new URLSearchParams({
          productId,
          name: form.name.value,
          location: form.location.value,
          rating: form.rating.value,
          reviewText: form.reviewText.value,
          imageBase64,
          imageFilename,
          imageMimeType
        });
        await fetch(submitUrl, { method: 'POST', mode: 'no-cors', body: data });
        status.textContent = 'Thank you! Your review will appear after we check it.';
        form.reset();
        setTimeout(() => { form.hidden = true; }, 1600);
      } catch (err) {
        status.textContent = 'Something went wrong. Please try again.';
      } finally {
        submitBtn.disabled = false;
      }
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
