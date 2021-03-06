// Use code to coordinate DoWhops.

var currentSessionID;

function getSesh(node) {
  FriendlyChat.prototype.getSession();
}

// Initializes FriendlyChat.
function FriendlyChat() {
  this.checkSetup();

  // Shortcuts to DOM Elements.
  this.adminDiv = document.getElementById('admin-input-form'); // Check.
  this.messageList = document.getElementById('messages');
  this.messageForm = document.getElementById('message-form');
  this.messageInput = document.getElementById('message');
  this.submitButton = document.getElementById('submit-message-button');
  this.submitImageButton = document.getElementById('submitImage');
  this.imageForm = document.getElementById('image-form');
  this.mediaCapture = document.getElementById('mediaCapture');
  this.userPic = document.getElementById('user-pic');
  this.userName = document.getElementById('user-name');
  this.signInSnackbar = document.getElementById('must-signin-snackbar');
  this.messageFormWhenDatePending = document.getElementById('whenDatePending');
  this.messageFormWhenTimePending = document.getElementById('whenTimePending');
  this.messageFormWherePending = document.getElementById('whereAddressPending');

  // Shortcuts to DOM elements for notification messages:
  this.radioApprove = document.getElementById('radioApprove');
  this.radioDeny = document.getElementById('radioDeny');
  this.approvalForm = document.getElementById('approve-pending-form');
  this.rescindingForm = document.getElementById('rescind-pending-form');
  this.pendingDiv = document.getElementById('pending-div');
  this.submitApproval = document.getElementById('submit-approval-button');
  this.submitRescind = document.getElementById('submit-rescind-button');

  // Load chat data:
  this.chatItemData = document.getElementById('coordinate-tab');
  this.chatItemData.addEventListener('click', this.loadMessages.bind(this)); // <-- Developer: return to this.

  // Save message on form submit:
  this.messageForm.addEventListener('submit', this.saveMessage.bind(this));

  // Toggle for the button:
  var buttonTogglingHandler = this.toggleButton.bind(this);
  this.messageInput.addEventListener('keyup', buttonTogglingHandler);
  this.messageInput.addEventListener('change', buttonTogglingHandler);

  // Events for time-change-approval buttons:
  this.submitApproval.addEventListener('click', this.sendApproval.bind(this));
  this.submitRescind.addEventListener('click', this.sendRescind.bind(this));

  // Events for image upload:
  this.submitImageButton.addEventListener(
    'click',
    function(e) {
      e.preventDefault();
      this.mediaCapture.click();
    }.bind(this)
  );
  this.mediaCapture.addEventListener('change', this.saveImageMessage.bind(this));
  this.initFirebase();
}

// Sets up shortcuts to Firebase features and initiate firebase auth:
FriendlyChat.prototype.initFirebase = function() {
  this.auth = firebase.auth();
  this.database = firebase.database();
  this.storage = firebase.storage();
  // Initiates Firebase auth and listen to auth state changes.
  this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
};

FriendlyChat.prototype.checkForAdmin = function() {
  var adminDiv = document.getElementById('admin-input-form');
};

FriendlyChat.prototype.sendApproval = function(e) {
  e.preventDefault();
  var choice, newDate, newTime, newWhere;
  this.chatItemDataSpecific = document.getElementById('dowhop-selector-container').children[0].id;
  var myRef = this.database.ref().child('doWhopDescription/' + this.chatItemDataSpecific);
  var myRefPending = this.database.ref().child('doWhopDescription/' + this.chatItemDataSpecific + '/pending');
  var messagesRef = this.database.ref().child('messages/' + this.chatItemDataSpecific);
  var status;

  myRefPending.once('value', function(snap) {
    newDate = snap.val().whenDatePending;
    newTime = snap.val().whenTimePending;
    newWhere = snap.val().whereAddressPending;
  });

  if (this.radioApprove.checked) {
    status = 'approved';
    myRef.update({
      whenDate: newDate,
      whenTime: newTime,
      whereAddress: newWhere
    });
    this.database.ref().child('doWhopDescription/' + this.chatItemDataSpecific + '/pending/').update({
      status: status
    });
  } else if (this.radioDeny.checked) {
    status = 'denied';
    this.database.ref().child('doWhopDescription/' + this.chatItemDataSpecific + '/pending/').update({
      status: status
    });
  }
  messagesRef.push({
    chatId: this.chatItemDataSpecific,
    name: '',
    text: person.displayName + ' has ' + status + ' the request.',
    photoUrl: 'https://static.wixstatic.com/media/de271e_daded027ba1f4feab7b1c26683bc84da~mv2.png/v1/fill/w_512,h_512,al_c/de271e_daded027ba1f4feab7b1c26683bc84da~mv2.png' // <- Customized.
  });

  // Notify the user of a change here:
  window.alert('You have responded to the change request!');

  // Add UI reset information here:
  this.approvalForm.setAttribute('hidden', 'true');
  this.rescindingForm.setAttribute('hidden', 'true');
  this.pendingDiv.innerHTML = '';
  this.pendingDiv.setAttribute('hidden', 'true');
};

FriendlyChat.prototype.sendRescind = function(e) {
  e.preventDefault();
  this.chatItemDataSpecific = document.getElementById('dowhop-selector-container').children[0].id; // <-- Refactor
  this.database.ref().child('doWhopDescription/' + this.chatItemDataSpecific + '/pending/').remove();
  // Send a notification to the user:
  window.alert('You have rescinded!');
  // Add UI reset information here:
  this.approvalForm.setAttribute('hidden', 'true');
  this.rescindingForm.setAttribute('hidden', 'true');
  this.pendingDiv.innerHTML = ''; // Return.
  this.pendingDiv.setAttribute('hidden', 'true');
};

// Add dynamic 'When' form:
FriendlyChat.prototype.showDateTimeInputs = function() {};

FriendlyChat.prototype.removeChats = function() {
  this.messageList.innerHTML = '';
};

FriendlyChat.prototype.getSession = function() {
  var myRef = firebase.database().ref('session/' + person.uid);
  var dowhopSelector = document.getElementById('dowhop-selector-container');
  // Add parts for the notification-pending displays:
  var pendingDiv = this.pendingDiv;
  var myApprovalForm = this.approvalForm;
  var myRescindingForm = this.rescindingForm;
  var pendingNotification = '';

  var checkForPendings = function(id, data) {
    var pendingNotification = '';
    // Check if there are pending notifications:
    if (
      data.val() &&
      data.val().pending != null &&
      data.val().pending.status != 'approved' &&
      data.val().pending.status != 'denied'
    ) {
      // console.log('pending status true. showing pending div.');
      document.getElementById('pending-div').removeAttribute('hidden');

      // This means visiting user is the creator of event:
      if (firebase.auth().currentUser.uid == data.val().createdBy|| person.email == data.val().creatorDescription) {
        // console.log('visiting user is the creator. showing approval form, hiding rescind form.');
        pendingNotification = 'Someone has requested this change.\nDo you want to approve it?';
        document.getElementById('pending-div').innerText =
          pendingNotification +
          '\nPending time: ' +
          data.val().pending.whenDatePending +
          ' at ' +
          data.val().pending.whenTimePending +
          '\nPending location: ' +
          data.val().pending.whereAddressPending;

        document.getElementById('approve-pending-form').removeAttribute('hidden');
        document.getElementById('rescind-pending-form').setAttribute('hidden', 'true');

        // This means visiting user is a requestor of event change:
      } else if (firebase.auth().currentUser.uid == data.val().pending.requester) {
        // console.log('visiting user requested a change. showing rescinding form, hiding approval form.');
        pendingNotification = 'You have requested this time!\nIt is pending. Do you want to change it?';
        document.getElementById('pending-div').innerText =
          pendingNotification +
          '\nPending time: ' +
          data.val().pending.whenDatePending +
          ' at ' +
          data.val().pending.whenDatePending +
          '\nPending location: ' +
          data.val().pending.whereAddressPending;

        document.getElementById('rescind-pending-form').removeAttribute('hidden');
        document.getElementById('approve-pending-form').setAttribute('hidden', 'true');
      }
      // All other cases:
    } else {
      // console.log('this means it has passed over logic tests.');
      document.getElementById('approve-pending-form').setAttribute('hidden', 'true');
      document.getElementById('pending-div').innerText = '';
      document.getElementById('approve-pending-form').setAttribute('hidden', 'true');
      document.getElementById('rescind-pending-form').setAttribute('hidden', 'true');
    }
  };

  myRef.on('value', function(data) {
    var dowhopSelector = document.getElementById('dowhop-selector-container');
    var dowhopSelectorDiv = '';
    // Setting the header and check for pendings for the current DoWhop session:
    // Checking for changed pendings in real-time:
    firebase
      .database()
      .ref()
      .child('doWhopDescription/' + data.val().current_dowhop)
      .on('child_changed', function(data) {
        checkForPendings(data.key, data);
      });

    // Extracting all of the relevant DoWhop-Selector-Block information:
    firebase.database().ref().child('doWhopDescription/' + data.val().current_dowhop).on('value', function(data) {
      // Check for pending notifications:
      checkForPendings(data.key, data);

      // Weave together header
      if (data.val()) {
        let imageUrl =
          data.val().downloadURL ||
          'https://static.wixstatic.com/media/de271e_a0f92b126d584e54a84a2f721c1571d4~mv2_d_3543_2480_s_4_2.jpg/v1/crop/x_0,y_221,w_3543,h_1159/fill/w_886,h_246,al_c,q_80,usm_0.66_1.00_0.01/de271e_a0f92b126d584e54a84a2f721c1571d4~mv2_d_3543_2480_s_4_2.webp';
        var doWhopDescriptionTitle = data.val().titleDescription || 'Your DoWhops Will Appear Here';
        return (dowhopSelectorDiv +=
          "<section id='" +
          data.key +
          "' class='dowhop-selector-block' onclick='sessionRef(this)''>" +
          "<div class='dowhop-selector-header-top' style='background-image: url(" +
          imageUrl +
          ");'>" +
          '<h1>' +
          doWhopDescriptionTitle +
          '</h1>' +
          '</div>' +
          '</section>');
      }
    });

    dowhopSelector.innerHTML = dowhopSelectorDiv;
  });
};

// Loads messages history and listens for upcoming ones:
FriendlyChat.prototype.loadMessages = function() {
  let user = person.uid;
  var chatIdCurrent = document.getElementById('dowhop-selector-container').firstChild.id; // <-- Refactor to ping Firebase db.
  this.messagesRef = this.database.ref().child('messages/' + chatIdCurrent);

  // Make sure we remove all previous listeners and clear the UI.
  this.messagesRef.off();
  this.messageList.innerText = '';

  // Loads the last x number of messages and listen for new ones:
  var setMessage = function(data) {
    var val = data.val();
    this.displayMessage(data.key, val.name, val.text, val.photoUrl, val.imageUrl);
  }.bind(this);
  this.messagesRef.orderByKey().limitToLast(12).on('child_added', setMessage);
  this.messagesRef.orderByKey().limitToLast(12).on('child_changed', setMessage);
};

// Saves a new message on the Firebase DB:
FriendlyChat.prototype.saveMessage = function(e) {
  e.preventDefault();

  // Mke sure this chat and message get sent to two appropriate places:
  this.chatItemDataSpecific = document.getElementById('dowhop-selector-container').children[0].id; // <-- Refactor

  // Nesting the message content under chat-id node headings:
  var messagesChatsRef = this.database.ref().child('messages/' + this.chatItemDataSpecific);
  var currentUser = person;
  var whenDatePending = this.whenDatePending;
  var whenTimePending = this.whenTimePending;
  var whereAddressPending = this.messageFormWherePending;

  // For only all three attributes: Time, Date, Where:
  if (this.messageFormWhenDatePending.value || this.messageFormWhenTimePending.value || this.messageFormWherePending) {
    var chatsRef = this.database.ref().child('doWhopDescription/' + this.chatItemDataSpecific + '/pending/');

    var messageText = "";

    messageText += currentUser.displayName + " has requested a change!\n";
    if (this.messageFormWherePending.value) messageText += "Where: " + this.messageFormWherePending.value + "\n";
    if (this.messageFormWhenTimePending.value || this.messageFormWhenDatePending.value) messageText += "On: ";
    if (this.messageFormWhenTimePending.value) messageText += this.messageFormWhenTimePending.value + "\n";
    if (this.messageFormWhenDatePending.value) messageText += this.messageFormWhenDatePending.value + "\n";

    messagesChatsRef.push({
      chatId: this.chatItemDataSpecific,
      name: currentUser.displayName,
      text: messageText,
      photoUrl: 'https://static.wixstatic.com/media/de271e_daded027ba1f4feab7b1c26683bc84da~mv2.png/v1/fill/w_512,h_512,al_c/de271e_daded027ba1f4feab7b1c26683bc84da~mv2.png' // <- Customized.
    });

    chatsRef.update({status: true, requester: currentUser.uid }); // Refactoring to make it a dis-aggregated update.
    if (this.messageFormWhenDatePending.value) chatsRef.update({ whenDatePending: this.messageFormWhenDatePending.value }).then(this.resetDate);
    if (this.messageFormWhenTimePending.value) chatsRef.update({  whenTimePending: this.messageFormWhenTimePending.value }).then(this.resetTime);
    if (this.messageFormWherePending.value) chatsRef.update({ whereAddressPending: this.messageFormWherePending.value }).then(this.resetWhere);
    this.resetDateTimeWhere; // Catch-all.

  }

  // Check that the user entered a message and is signed in:
  if (this.messageInput.value && this.checkSignedInWithMessage()) {
    messagesChatsRef
      .push({
        chatId: this.chatItemDataSpecific,
        name: currentUser.displayName,
        text: this.messageInput.value,
        photoUrl: currentUser.photoURL ||
          'https://static.wixstatic.com/media/de271e_daded027ba1f4feab7b1c26683bc84da~mv2.png/v1/fill/w_512,h_512,al_c/de271e_daded027ba1f4feab7b1c26683bc84da~mv2.png' // <- Customized.
      })
      .then(
        function() {
          // Clear message text field and SEND button state:
          FriendlyChat.resetMaterialTextfield(this.messageInput);
          this.toggleButton();
        }.bind(this)
      )
      .catch(function(error) {
        console.error('Error writing new message to Firebase Database', error);
      });
  }
};

FriendlyChat.prototype.resetDate = function() {
  document.getElementById('whenDatePending').value = null;
};

FriendlyChat.prototype.resetTime = function() {
  document.getElementById('whenTimePending').value = null;
};

FriendlyChat.prototype.resetWhere = function() {
  document.getElementById('whereAddressPending').value = null;
};

FriendlyChat.prototype.resetDateTimeWhere = function() {
  document.getElementById('whenDatePending').value = null;
  document.getElementById('whenTimePending').value = null;
  document.getElementById('whereAddressPending').value = null;
};

// Sets the URL of the given img element with the URL of the image stored in Cloud Storage.
FriendlyChat.prototype.setImageUrl = function(imageUri, imgElement) {
  // If the image is a Cloud Storage URI we fetch the URL.
  if (imageUri.startsWith('gs://')) {
    imgElement.src = FriendlyChat.LOADING_IMAGE_URL; // Display a loading image first.
    this.storage.refFromURL(imageUri).getMetadata().then(function(metadata) {
      imgElement.src = metadata.downloadURLs[0];
    });
  } else {
    imgElement.src = imageUri;
  }
};

// Saves a new message containing an image URI in Firebase.
// This first saves the image in Firebase storage.
FriendlyChat.prototype.saveImageMessage = function(event) {
  event.preventDefault();
  var file = event.target.files[0];

  // Clear the selection in the file picker input.
  this.imageForm.reset();

  // Check if the file is an image.
  if (!file.type.match('image.*')) {
    var data = {
      message: 'You can only share images',
      timeout: 2000
    };
    this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
    return;
  }
  // Check if the user is signed-in
  if (this.checkSignedInWithMessage()) {
    // We add a message with a loading icon that will get updated with the shared image.
    var currentUser = person;
    this.messagesRef
      .push({
        name: currentUser.displayName,
        imageUrl: FriendlyChat.LOADING_IMAGE_URL,
        photoUrl: currentUser.photoURL || '/images/profile_placeholder.png'
      })
      .then(
        function(data) {
          // Upload the image to Cloud Storage.
          var filePath = currentUser.uid + '/' + data.key + '/' + file.name;
          return this.storage.ref(filePath).put(file).then(
            function(snapshot) {
              // Get the file's Storage URI and update the chat message placeholder.
              var fullPath = snapshot.metadata.fullPath;
              return data.update({ imageUrl: this.storage.ref(fullPath).toString() });
            }.bind(this)
          );
        }.bind(this)
      )
      .catch(function(error) {
        console.error('There was an error uploading a file to Cloud Storage:', error);
      });
  }
};

// Signs-in Friendly Chat.
FriendlyChat.prototype.signIn = function() {
  // Sign in Firebase using popup auth and Google as the identity provider.
  var provider = new firebase.auth.GoogleAuthProvider();
  this.auth.signInWithPopup(provider);
};

// Signs-out of Friendly Chat and resets views:
FriendlyChat.prototype.signOut = function() {
  this.removeChats();
  this.pendingDiv.setAttribute('hidden', 'true');
  this.approvalForm.setAttribute('hidden', 'true');
  this.rescindingForm.setAttribute('hidden', 'true');
  this.auth.signOut();
};

// Triggers when the auth state change for instance when the user signs-in or signs-out.
FriendlyChat.prototype.onAuthStateChanged = function(user) {
  if (user) {
    // User is signed in!
    // Get profile pic and user's name from the Firebase user object.
    var profilePicUrl = user.photoURL;
    var userName = user.displayName;
    this.checkForAdmin();
    // Add event listener for event session changes:
    this.getSession(currentSessionID);
    // We save the Firebase Messaging Device token and enable notifications.
    this.saveMessagingDeviceToken();
  } else {
    // User is signed out!
  }
};

// Returns true if user is signed-in. Otherwise false and displays a message.
FriendlyChat.prototype.checkSignedInWithMessage = function() {
  if (person) {
    return true;
  }
  // Display a message to the user using a Toast.
  var data = {
    message: 'You must sign-in first, please!',
    timeout: 2000
  };
  this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
  return false;
};

// Saves the messaging device token to the datastore.
FriendlyChat.prototype.saveMessagingDeviceToken = function() {
  firebase
    .messaging()
    .getToken()
    .then(
      function(currentToken) {
        if (currentToken) {
          // Saving the Device Token to the datastore.
          firebase.database().ref('/fcmTokens').child(currentToken).set(firebase.auth().currentUser.uid);
        } else {
          // Need to request permissions to show notifications.
          this.requestNotificationsPermissions();
        }
      }.bind(this)
    )
    .catch(function(error) {
      console.error('Unable to get messaging token.', error);
    });
};

// Requests permissions to show notifications.
FriendlyChat.prototype.requestNotificationsPermissions = function() {
  firebase
    .messaging()
    .requestPermission()
    .then(
      function() {
        // Notification permission granted.
        this.saveMessagingDeviceToken();
      }.bind(this)
    )
    .catch(function(error) {
      console.error('Unable to get permission to notify.', error);
    });
};

// Resets the given MaterialTextField.
FriendlyChat.resetMaterialTextfield = function(element) {
  element.value = '';
  if (element.parentNode.MaterialTextfield) {
    element.parentNode.MaterialTextfield.boundUpdateClassesHandler();
  }
};

// Template for messages.
FriendlyChat.MESSAGE_TEMPLATE =
  '<div class="message-container">' +
  '<div class="spacing"><div class="pic"></div></div>' +
  '<div class="message"></div>' +
  '<div class="name"></div>' +
  '</div>';

// Templates for Chats:
FriendlyChat.CHAT_TEMPLATE =
  '<button type="submit" class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect dowhop-button">' +
  '</button>';

// A loading image URL.
FriendlyChat.LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif';

// Tempalte for approval-denial of time-change form:
FriendlyChat.APPROVAL_TEMPLATE =
  '<div class="pending-style">' +
  '<div>' +
  '<button type="submit" class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect dowhop-button">' +
  '</button>' +
  '</div>' +
  '</div>';

// Displays a Message in the UI.
FriendlyChat.prototype.displayMessage = function(key, name, text, picUrl, imageUri) {
  var div = document.getElementById(key);
  // If an element for that message does not exists yet we create it.
  if (!div) {
    var container = document.createElement('div');
    container.innerHTML = FriendlyChat.MESSAGE_TEMPLATE;
    div = container.firstChild;
    div.setAttribute('id', key);
    this.messageList.appendChild(div);
  }
  if (picUrl) {
    div.querySelector('.pic').style.backgroundImage = 'url(' + picUrl + ')';
  }
  div.querySelector('.name').textContent = name;
  var messageElement = div.querySelector('.message');
  if (text) {
    // If the message is text.
    messageElement.textContent = text;
    // Replace all line breaks by <br>.
    messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
  } else if (imageUri) {
    // If the message is an image.
    var image = document.createElement('img');
    image.addEventListener(
      'load',
      function() {
        this.messageList.scrollTop = this.messageList.scrollHeight;
      }.bind(this)
    );
    this.setImageUrl(imageUri, image);
    messageElement.innerHTML = '';
    messageElement.appendChild(image);
  }
  // Show the card fading-in.
  setTimeout(function() {
    div.classList.add('visible');
  }, 1);
  this.messageList.scrollTop = this.messageList.scrollHeight;
  this.messageInput.focus();
};

// Enables or disables the submit button depending on the values of the input
// fields.
FriendlyChat.prototype.toggleButton = function() {
  if (this.messageInput.value) {
    this.submitButton.removeAttribute('disabled');
  } else {
    this.submitButton.setAttribute('disabled', 'true');
  }
};

// Checks that the Firebase SDK has been correctly setup and configured.
FriendlyChat.prototype.checkSetup = function() {
  if (!window.firebase || !(firebase.app instanceof Function) || !window.config) {
    window.alert(
      'You have not configured and imported the Firebase SDK. ' +
        'Make sure you go through the codelab setup instructions.'
    );
  } else if (config.storageBucket === '') {
    window.alert(
      'Your Cloud Storage bucket has not been enabled. Sorry about that. This is ' +
        'actually a Firebase bug that occurs rarely. ' +
        'Please go and re-generate the Firebase initialisation snippet (step 4 of the codelab) ' +
        'and make sure the storageBucket attribute is not empty. ' +
        'You may also need to visit the Storage tab and paste the name of your bucket which is ' +
        'displayed there.'
    );
  }
};

window.onload = function() {
  window.friendlyChat = new FriendlyChat();
};
