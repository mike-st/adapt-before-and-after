define(function(require) {

    var ComponentView = require('coreViews/componentView');
    var Adapt = require('coreJS/adapt');

    var ResultsGraphic = ComponentView.extend({

      events: {
            'inview': 'onInview'
        },

        preRender: function () {
            this.setupEventListeners();
            this.setupModelResetEvent();
            this.checkIfVisible();
        },

        checkIfVisible: function() {

            var wasVisible = this.model.get("_isVisible");
            var isVisibleBeforeCompletion = this.model.get("_isVisibleBeforeCompletion") || false;

            var isVisible = wasVisible && isVisibleBeforeCompletion;

            var assessmentArticleModels = Adapt.assessment.get();
            if (assessmentArticleModels.length === 0) return;

            var isComplete = this.isComplete();

            if (!isVisibleBeforeCompletion) isVisible = isVisible || isComplete;

            this.model.set('_isVisible', isVisible);

            // if assessment(s) already complete then render
            if (isComplete) this.onAssessmentComplete(Adapt.assessment.getState());
        },

        isComplete: function() {
            var isComplete = false;

            var assessmentArticleModels = Adapt.assessment.get();
            if (assessmentArticleModels.length === 0) return;

            for (var i = 0, l = assessmentArticleModels.length; i < l; i++) {
                var articleModel = assessmentArticleModels[i];
                var assessmentState = articleModel.getState();
                isComplete = assessmentState.isComplete;
                if (!isComplete) break;
            }

            if (!isComplete) {
                this.model.reset("hard", true);
            }

            return isComplete;
        },

        setupModelResetEvent: function() {
            if (this.model.onAssessmentsReset) return;
            this.model.onAssessmentsReset = function(state) {
                this.reset('hard', true);
            };
            this.model.listenTo(Adapt, 'assessments:reset', this.model.onAssessmentsReset);
        },

        postRender: function() {
            this.setReadyStatus();
        },
        setupEventListeners: function() {
            this.listenTo(Adapt, 'assessment:complete', this.onAssessmentComplete);
            this.listenToOnce(Adapt, 'remove', this.onRemove);
        },

        removeEventListeners: function() {;
            this.stopListening(Adapt, 'assessment:complete', this.onAssessmentComplete);
            this.stopListening(Adapt, 'remove', this.onRemove);
            this.$el.off("inview");
        },

        onAssessmentComplete: function(state) {
            this.model.set("_state", state);
            this.setFeedback();

            //show feedback component
            this.render();
            this.setFeedback();
            if(!this.model.get('_isVisible')) this.model.set('_isVisible', true, {pluginName: "results-graphic"});

        },

        onInview: function(event, visible, visiblePartX, visiblePartY) {
            if (visible) {
                if (visiblePartY === 'top') {
                    this._isVisibleTop = true;
                } else if (visiblePartY === 'bottom') {
                    this._isVisibleBottom = true;
                } else {
                    this._isVisibleTop = true;
                    this._isVisibleBottom = true;
                }

                if (this._isVisibleTop || this._isVisibleBottom) {
                    this.setCompletionStatus();
                }
            }
        },

        setFeedback: function() {
            var completionBody = this.model.get("_completionBody");
            var feedbackBand = this.getFeedbackBand();

            var state = this.model.get("_state");
            state.feedbackBand = feedbackBand;
            state.graphic = feedbackBand._src;

            this.$('.results-graphic-widget img').attr('src', state.graphic);
        },

        getFeedbackBand: function() {
            var state = this.model.get("_state");

            var bands = this.model.get("_bands");
            var scoreAsPercent = state.scoreAsPercent;

            for (var i = (bands.length - 1); i >= 0; i--) {
                if (scoreAsPercent >= bands[i]._score) {
                    return bands[i];
                }
            }
            return "";
        },

        onRemove: function() {
            this.removeEventListeners();
            ComponentView.prototype.remove.apply(this, arguments);
        }

    });

    Adapt.register('results-graphic', ResultsGraphic);

    return ResultsGraphic;

});
