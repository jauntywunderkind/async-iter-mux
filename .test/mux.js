#!/usr/bin/env node
import tape from "tape"
import Mux from "../mux.js"
import Fixture012 from "./_fixture_012.js"

tape( "mux", async function( t){
	const
		mux= new Mux(),
		stream= Fixture012()
	mux.add( stream)

	let cur= 0
	for await( let n of mux){
		t.equal( n, cur, `value=${cur}`)
		++cur
	}
	t.equal( cur, 3, "length correct")
	t.end()
})

tape( "empty mux is done", async function( t){
	const
		mux= new Mux(),
		iteration= await mux.next()
	t.ok( iteration.done, "done")
	t.end()
})

tape( "constructor accepts streams", async function( t){
	const
		i1= Fixture012(),
		i2= Fixture012(),
		mux= new Mux({ streams:[ i1, i2]})
	let agg= 0
	for await( let n of mux){
		agg+= n
	}
	t.equal( agg, 6, "agg=6")
	t.end()
})
