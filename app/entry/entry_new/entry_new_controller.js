"use strict";

function EntryNewController($scope, $state, $timeout, $q,
  Entry, Tag, Codekit, AuthService, API, DolphinService, toaster) {

  function constructor() {
    $scope.tags = [];
    $scope.dolphinService = DolphinService;
    $scope.tagsToSubmit = [];
    $scope.statuses = Codekit.entryStatuses;
    $scope.formats = Codekit.entryFormats;
    $scope.form = new Entry({
      status: $scope.statuses[0].id,
      format: Codekit.entryFormats.text.id
    });

    // Add space from top for toolbar
    if (Codekit.isMobile()) {
      $timeout(function () {
        angular.element(".editor").css(
          'margin-top', angular.element(".ta-toolbar").height()
        );
      }, 1000);
    }

    API.Tags.get({ site: AuthService.getCurrentSite() },
      function (data) {
        angular.forEach(data.results, function (data) {
          var tag = new Tag({
            slug: data.slug,
            id: data.id,
            name: data.name,
            count: data.tagged_items_count
          });
          $scope.tags.push(tag.get);
        });
      }
    );
  }

  /**
   * @desc query tags
   */
  function load() {
    var deferred = $q.defer();
    deferred.resolve($scope.tags);
    return deferred.promise;
  }

  /**
   * @desc Load tags and filter them
   *
   * @param {string} query
   */
  $scope.loadTags = function (query) {
    return load().then(function (response) {
      $scope.tags = response;
      return $scope.tags.filter(function (tag) {
        return tag.name.toLowerCase().indexOf(query.toLowerCase()) !== -1;
      });
    });
  };


  /**
   * @desc Submit newPost form
   *
   * @param {object} form Form data to submit
   */
  $scope.newPost = function (form) {
    form.loading = true;
    form.get.site = AuthService.getCurrentSite();
    form.get.user = AuthService.getAuthenticatedUser(false);

    var payload = form.get;
    payload.tag_ids = [];

    angular.forEach($scope.tagsToSubmit, function (tag) {
      payload.tag_ids.push(tag.id);
    });

    // Remove image placeholder
    payload.content = payload.content
      .replace(/<p><img src="assets\/img\/avatar.png"><\/p>/g, "")
      .replace(/<p><\/p>/g, "");

    API.EntryAdd.save(payload,
      function (data) {
        $scope.form.cache(true);
        toaster.success("Done", "Created " + payload.title);
        $state.go("dash.entry-edit", { entryId: data.id });
      },
      function (data) {
        toaster.error("Error", "Failed to add entry");
        form.loading = false;
        form.errors = data.data;
      }
    );
  };

  /**
   * @desc Image selection callback
   *
   * @param {Event} event
   * @param {dolphin} dolphin
   * @param {string} source
   */
  $scope.$on("gonevisDash.Dolphin:select", function (event, dolphin, source) {
    if (source === "entryCover") {
      $scope.form.get.cover_image = dolphin ? dolphin.get.id : null;
    } else if (source === "editorAddImage") {
      $scope.form.get.content = $scope.form.get.content.replace("assets/img/avatar.png", dolphin.get.file);
    }
  });

  constructor();
}

app.controller("EntryNewController", EntryNewController);
EntryNewController.$inject = [
  "$scope",
  "$state",
  "$timeout",
  "$q",
  "Entry",
  "Tag",
  "Codekit",
  "AuthService",
  "API",
  "DolphinService",
  "toaster"
];
