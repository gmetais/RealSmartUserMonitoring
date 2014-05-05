module.exports = visitModel;

function visitModel(mongoose) {

    // Mongoose schema definition
    var visitSchema = mongoose.Schema({
        userId: Number,
        pageViews: Number,
        arrivalData: Date,
        averageLoadTime: Number,
        conversion: Boolean
    });

    // Mongoose model compilation
    var Visit = mongoose.model('Visit', visitSchema);

    return Visit;
}