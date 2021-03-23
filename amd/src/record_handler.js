define(['jquery'], function ($) {
    return {
        init: function (room, instrutor, language, url_jitsi, url_recording_service) {

            isRecording = false;

            imgSource = {
                toInit: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' height=\'24px\' viewBox=\'0 0 24 24\' width=\'24px\' fill=\'%23000000\'%3E%3Cpath d=\'M0 0h24v24H0V0z\' fill=\'none\'/%3E%3Cpath d=\'M10 8.64L15.27 12 10 15.36V8.64M8 5v14l11-7L8 5z\'/%3E%3C/svg%3E',
                toStop: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' height=\'24px\' viewBox=\'0 0 24 24\' width=\'24px\' fill=\'%23ff0000\'%3E%3Cpath d=\'M0 0h24v24H0V0z\' fill=\'none\'/%3E%3Cpath d=\'M16 8v8H8V8h8m2-2H6v12h12V6z\'/%3E%3C/svg%3E',
                starting: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' enable-background=\'new 0 0 24 24\' height=\'24px\' viewBox=\'0 0 24 24\' width=\'24px\' fill=\'%23000000\'%3E%3Cg%3E%3Crect fill=\'none\' height=\'24\' width=\'24\'/%3E%3C/g%3E%3Cg%3E%3Cpath d=\'M18,22l-0.01-6L14,12l3.99-4.01L18,2H6v6l4,4l-4,3.99V22H18z M8,7.5V4h8v3.5l-4,4L8,7.5z\'/%3E%3C/g%3E%3C/svg%3E',
                stopping: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' enable-background=\'new 0 0 24 24\' height=\'24px\' viewBox=\'0 0 24 24\' width=\'24px\' fill=\'%23000000\'%3E%3Cg%3E%3Crect fill=\'none\' height=\'24\' width=\'24\'/%3E%3C/g%3E%3Cg%3E%3Cpath d=\'M18,22l-0.01-6L14,12l3.99-4.01L18,2H6v6l4,4l-4,3.99V22H18z M8,7.5V4h8v3.5l-4,4L8,7.5z\'/%3E%3C/g%3E%3C/svg%3E',
                checking: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' enable-background=\'new 0 0 24 24\' height=\'24px\' viewBox=\'0 0 24 24\' width=\'24px\' fill=\'%23000000\'%3E%3Cg%3E%3Crect fill=\'none\' height=\'24\' width=\'24\'/%3E%3C/g%3E%3Cg%3E%3Cpath d=\'M18,22l-0.01-6L14,12l3.99-4.01L18,2H6v6l4,4l-4,3.99V22H18z M8,7.5V4h8v3.5l-4,4L8,7.5z\'/%3E%3C/g%3E%3C/svg%3E',
            };

            strings = {
                pt_br: {
                    toStop: 'Parar gravação',
                    toInit: 'Iniciar gravação',
                    starting: 'Iniciando gravação',
                    stopping: 'Parando gravação',
                    recordNotActive: 'Gravação não foi iniciada',
                    serverError: 'Houve algum erro no servidor de gravação',
                    checking: 'Verificando gravação'
                },
                en: {
                    toStop: 'Stop recording',
                    toInit: 'Start recording',
                    starting: 'Starting recording',
                    stopping: 'Stopping recording',
                    recordNotActive: 'Recording is not active',
                    serverError: 'There was an error on the recording server',
                    checking: 'Checking recording'
                }
            }

            checkRecordingStatus();

            function post(path, data) {
                return $.ajax(
                    {
                        type: 'POST',
                        url: `${url_recording_service}/${path}`,
                        dataType: 'json',
                        data: JSON.stringify(data),
                        contentType: 'application/json',
                        cache: false,
                        processData: false
                    }

                )
            }

            function get(path) {
                return $.ajax(
                    {
                        type: 'GET',
                        url: `${url_recording_service}/${path}`,
                        cache: false,
                        processData: false
                    }

                )
            }

            function record() {

                const content =  {
                    'jitsi-meet-url': `${url_jitsi}/${room}`,
                    instrutor: instrutor
                }
                const request = post('start-recording', content);

                changeButtonState('starting');

                request
                    .done(function(res) {
                        isRecording = !isRecording;
                        changeButtonState('started');
                        currentDisplayId = res.data.display_id;
                    })
                    .fail(function(err) {
                        showError(getString('serverError'));
                        changeButtonState('stopped');
                    });

            }

            function checkRecordingStatus() {

                changeButtonState('checking');

                let request = get(`recording-status-by-url?meeting=${url_jitsi}/${room}`);
                request
                    .done(function (res) {
                       isRecording = true;
                       currentDisplayId = res.data.display_id;
                       changeButtonState('started');

                    })
                    .fail(function(err) {
                        isRecording = false;
                        changeButtonState('stopped');
                        window.localStorage.removeItem('mod_jitsi_record_display_id');
                    });
            }

            function stop() {

                const content = { display_id: parseInt(currentDisplayId) }

                const request = post('stop-recording', content);

                changeButtonState('stopping');

                request
                    .done(function(res) {
                        isRecording = !isRecording;
                        changeButtonState('stopped');
                        currentDisplayId = null;
                        window.localStorage.removeItem('mod_jitsi_record_display_id');
                    })
                    .fail(function(err) {
                        if (err.status === 400) {
                            showError(getString('recordNotActive'));
                        }

                        if (err.status === 500) {
                            showError(getString('serverError'));
                        }

                        changeButtonState('started');

                    });
            }

            function toggleRecord() {
                showError('');

                if (isRecording) {
                    stop();
                } else {
                    record();
                }
            }

            function changeButtonState(state) {
                const buttonElement = document.querySelector("#mod_jitsi_record_button");
                const imgElement = document.querySelector("#mod_jitsi_record_button img");
                const textElement = document.querySelector("#mod_jitsi_record_button #mod_jitsi_record_text");

                switch (state) {
                    case 'started':
                        imgElement.setAttribute('src', imgSource.toStop);
                        textElement.innerHTML = getString('toStop');
                        buttonElement.removeAttribute('disabled');
                        break;
                    case 'stopped':
                        imgElement.setAttribute('src', imgSource.toInit);
                        textElement.innerHTML = getString('toInit');
                        buttonElement.removeAttribute('disabled');
                        break;
                    case 'starting':
                        imgElement.setAttribute('src', imgSource.starting);
                        textElement.innerHTML = getString('starting');
                        buttonElement.setAttribute('disabled', 'true');
                        break;
                    case 'stopping':
                        imgElement.setAttribute('src', imgSource.stopping);
                        textElement.innerHTML = getString('stopping');
                        buttonElement.setAttribute('disabled', 'true');
                        break;
                    case 'checking':
                        imgElement.setAttribute('src', imgSource.checking);
                        textElement.innerHTML = getString('checking');
                        buttonElement.setAttribute('disabled', 'true');
                        break;
                }
            }

            function getString(key) {
                const stringKeys = Object.keys(strings);

                const lang = stringKeys.includes(language) ? language : 'en';

                return strings[lang][key] ? strings[lang][key] : null;
            }

            function showError(message) {
                document.querySelector('#mod_jitsi_record_button_error').innerHTML = message;
            }

            $("#mod_jitsi_record_button").on('click', function () {
                toggleRecord();
            });
        }
    }
});