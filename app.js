function bind(func, scope) {
  return function() {
    func.apply(scope, arguments);
  };
}

var eddie = {
  change: function(e) {
    if (this.checkbox().checked) {
      Notification.requestPermission();
      ga('send', 'clicked-notify');
    }
    this.save();
  },

  checkbox: function() {
    return document.getElementById('notify');
  },

  close: function() {
    if (!this.notification)
      return;

    this.notification.close();
    this.notification = null;
  },

  init: function() {
    window.onresize = bind(this.resize, this);
    window.onload = bind(this.load, this);
    window.onbeforeunload = window.onunload = bind(this.close, this);
    io.connect().on('change', bind(this.message, this));
  },

  load: function() {
    this.checkbox().checked = /notify=true/.test(document.cookie);
    this.checkbox().onchange = bind(this.change, this);
  },

  message: function(status) {
    if (status == this.status().textContent.trim())
      return;

    document.body.className = status == 'YES' ? 'here' : '';
    this.status().textContent = status;
    this.resize();

    window.setTimeout(bind(this.notify, this), 10000);
  },

  resize: function() {
    this.status().style.marginTop = -this.status().offsetHeight / 2 + 'px';
  },

  save: function() {
    document.cookie = 'notify=' + this.checkbox().checked;
  },

  notify: function() {
    if (!document.hidden)
      return;

    if (!window.Notification) // feature detect for Notifications
      return;

    if (this.notification)  // only show 1 notification at a time
      return;

    if (!this.checkbox().checked)
      return;

    if (this.status().textContent.trim() != 'YES')
      return;

    this.notification = new Notification("Is Eddie here?", {
      body: 'YES, Eddie is back.',
      icon: 'icon.png'
    });
    ga('send', 'notified');

    this.checkbox().checked = false;
    this.save();

    window.setTimeout(bind(this.close, this), 5000);
  },

  status: function() {
    return document.getElementById('status');
  }
};

eddie.init();
