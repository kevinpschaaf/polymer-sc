org=${1:-"kevinpschaaf"}
repo=${2:-"polymer-sc"}

polybuild --maximum-crush index.html
echo js:   `gzip -c index.build.js | wc -c`
echo html: `gzip -c index.build.html | wc -c`

rm -rf deploy
git clone -b gh-pages --single-branch git@github.com:$org/$repo.git deploy

cp index.build.html deploy/index.html
cp index.build.js deploy
cp callback.html deploy
rm -rf deploy/resources
cp -rf resources deploy

pushd deploy >/dev/null

git add -A .
git commit -am 'update gh-pages'
git push -u origin gh-pages:gh-pages

popd >/dev/null