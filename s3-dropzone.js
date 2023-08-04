window.Dropzone = require("dropzone");
Dropzone.autoDiscover = false;

function activateDropzone($dropzone, attrs={}) {
    if(!$dropzone.length) {
        console.error("Error! [dropzone.js] Unable to find requested element ", $dropzone);
        return;
    }

    const selector = "#" + $dropzone.attr("id");
    const $data = $(selector).data();
    var file_id = '';
    var file_url = '';
    var file_fields = {};

    const extraAttrs = {};
    Object.keys($data).filter(attr => attr.startsWith("dz_")).forEach((attr) => {
        const attrKey = attr.replace("dz_", "");
        extraAttrs[attrKey] = $data[attr];
    });

    var hasVideoPermission = true;
    if (typeof disabaledDropzoneId === "string") {
        hasVideoPermission = false;
    }

    const params = Object.assign({
        url: "#",
        method: "post",
        addRemoveLinks: hasVideoPermission,
        clickable: hasVideoPermission,
        dictRemoveFile: gettext("Clear"),
        autoProcessQueue: true,
        uploadMultiple: false,
        parallelUploads: 1,
        maxFiles: 1,
        maxFilesize: 300,
        timeout: 5 * 60000, // minutes
        dictDefaultMessage: gettext("Drop files here or click to browse."),
        accept: (file, done) => {
            $.ajax({
                method: "post",
                url: "/api/media/",
                data: {
                    name: file.name,
                    file_size: file.size,
                    file_type: file.type,
                    media_type: $data["dz_media_type"],
                    csrfmiddlewaretoken: window.ShuupAdminConfig.csrf
                },
                success: (response) => {
                    file_url = response.file_url;
                    file_id = response.id;
                    file_fields = response.file_fields;
                    file.uploadURL = response.url;
                    setTimeout(() => dropzone.processFile(file))
                },
                error: (xhr, status, error) => {
                    Messages.enqueue({
                        tags: "error",
                        text: xhr.responseJSON.error
                    });
                }
            });
        }
    }, extraAttrs, attrs);
    const dropzone = new Dropzone(selector, params);

    dropzone.on('processing', (file) => {
        dropzone.options.url = file.uploadURL;
        dropzone.options.params = file_fields;
    })

    dropzone.on("removedfile", attrs.onSuccess || function(data) {
        $(selector).find("input").val("");
    });

    // TODO: update field id_base-video_media_url to var

    dropzone.on("success", attrs.onSuccess || function(data) {
        $(selector).find("input").val(file_id);
        $("#id_base-video_media_url").val(file_url);
    });

    const data = $(selector).data();
    if($("#id_base-video_media_url").val()) {
        data.url = $("#id_base-video_media_url").val();
        dropzone.files.push(data);
        dropzone.emit("addedfile", data);
        dropzone.emit("complete", data);
    }

}

window.activateVideoDropzones = () => {
    $("div[data-video_dropzone='true']").each((idx, object) => {
        const dropzone = $(object);
        if(!dropzone.attr("id").includes("__prefix__")) {
            activateDropzone(dropzone);
        }
    });
};
$(() => {
    window.activateVideoDropzones();
});
