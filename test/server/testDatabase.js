var expect = require('chai').expect;
var database = require('../../lib/database.js')({debug: false});
console.log(database);

describe('Database', function(){
    describe('getIdealRange()', function(){
        it('should floor the min and ceil the max', function(){
            var results = database.getIdealRange(480, 4790);
            expect(results).to.have.a.property('min', 400);
            expect(results).to.have.a.property('max', 4800);
            expect(results).to.have.a.property('interval', 200);

            var results2 = database.getIdealRange(520, 4810);
            expect(results2).to.have.a.property('min', 400);
            expect(results2).to.have.a.property('max', 5000);
            expect(results2).to.have.a.property('interval', 200);
        });
        it('should work when min = max', function(){
            var results = database.getIdealRange(1500, 1500);
            expect(results).to.have.a.property('min', 1500);
            expect(results).to.have.a.property('max', 1500);
            expect(results).to.have.a.property('interval', 1);
        });
        it('should work with a very small interval', function(){
            var results = database.getIdealRange(12, 15);
            expect(results).to.have.a.property('min', 12);
            expect(results).to.have.a.property('max', 15);
            expect(results).to.have.a.property('interval', 1);
        });
        it('should work with a very large interval', function(){
            var results = database.getIdealRange(0, 9999999999);
            expect(results).to.have.a.property('min', 0);
            expect(results).to.have.a.property('max', 10000000000);
            expect(results).to.have.a.property('interval', 500000);
        });
    });

    describe('transformToSerie()', function(){
        it('should floor the min and ceil the max', function(){
            var buckets = [
                {
                    "key": 43,
                    "doc_count": 1
                },
                {
                    "key": 46,
                    "doc_count": 3
                },
                {
                    "key": 48,
                    "doc_count": 1
                },
                {
                    "key": 51,
                    "doc_count": 2
                }
            ];

            var serie = database.transformToSerie(buckets);

            expect(serie).to.deep.equal([[43, 1], [46, 3], [48, 1], [51, 2]]);
        });
    });

    /*describe('filterLessAndMore()', function(){

        it('should remove all keys under 47', function(){
            var before = [[43, 1], [46, 3], [48, 1], [51, 2]];
            var after = database.filterLessAndMore(before, 47, 1000);

            expect(after).to.deep.equal([['less', 4], [48, 1], [51, 2], ['more', 0]]);
        });
        it('should not remove key 46', function(){
            var before = [[43, 1], [46, 3], [48, 1], [51, 2]];
            var after = database.filterLessAndMore(before, 46, 1000);

            expect(after).to.deep.equal([['less', 1], [46, 3], [48, 1], [51, 2], ['more', 0]]);
        });
        it('should remove all keys over 47', function(){
            var before = [[43, 1], [46, 3], [48, 1], [51, 2]];
            var after = database.filterLessAndMore(before, 1, 47);

            expect(after).to.deep.equal([['less', 0], [43, 1], [46, 3], ['more', 3]]);
        });
        it('should no remove key 48', function(){
            var before = [[43, 1], [46, 3], [48, 1], [51, 2]];
            var after = database.filterLessAndMore(before, 1, 48);

            expect(after).to.deep.equal([['less', 0], [43, 1], [46, 3], [48, 1], ['more', 2]]);
        });
        it('should remove key 43 and 51', function(){
            var before = [[43, 1], [46, 3], [48, 1], [51, 2]];
            var after = database.filterLessAndMore(before, 46, 48);

            expect(after).to.deep.equal([['less', 1], [46, 3], [48, 1], ['more', 2]]);
        });
    });*/
});